const fs = require('fs');
const clone = require('lodash.clone');
const aluno = require('../server/models').alunos;
const indicadosAvaliadores = require('../server/models').indicacao_avaliadores;
const help = require('./helper');
const DB = require('./DB_helper');
const surveysInfo = require('./sm_surveys');
const rules = require('./notificationRules');
const mailer = require('./mailer');
const broadcast = require('./broadcast');


async function findCurrentModulo(turmaData, today = new Date()) {
	try {
		let currentModule = 1;

		for (let i = 1; i <= 3; i++) {
			const moduleX = turmaData[`modulo${i}`];
			if (today >= new Date(moduleX)) { currentModule = i; }
		}

		return currentModule;
	} catch (error) {
		help.sentryError('Erro em findCurrentModulo', error);
		return null;
	}
}

async function extendRecipient(recipient, turma) {
	if (!recipient || !turma) return null;
	const result = recipient;

	if (turma.modulo1) { result.mod1 = turma.modulo1; }
	if (turma.modulo2) { result.mod2 = turma.modulo2; }
	if (turma.modulo3) { result.mod3 = turma.modulo3; }
	if (turma.local) { result.local = turma.local; }

	const now = new Date(); // figure out which module the aluna is on
	if (turma.modulo1 >= now) { result.moduloAvisar = 1; }
	if (turma.modulo2 >= now) { result.moduloAvisar = 2; }
	if (turma.modulo3 >= now) { result.moduloAvisar = 3; }

	return result;
}

async function getRecipient(notification, turma) {
	try {
		let recipient = null;

		if (notification.aluno_id && !notification.indicado_id) {
			recipient = await aluno.findByPk(notification.aluno_id, { raw: true, include: ['chatbot'] }).then((r) => r).catch((err) => help.sentryError('Erro ao carregar aluno', err));
		} else if (notification.indicado_id) {
			recipient = await indicadosAvaliadores.findByPk(notification.indicado_id, { raw: true, include: ['respostas', 'aluna'] }).then((r) => r).catch((err) => help.sentryError('Erro ao carregar indicado', err));
		}

		recipient.turma_id = turma.id;
		recipient.turmaName = turma.nome;
		recipient.local = turma.local;

		const fullRecipient = await extendRecipient(recipient, turma);
		if (!recipient) throw new help.MyError('Erro ao carregar recipient', { fullRecipient, recipient });

		return recipient;
	} catch (error) {
		help.sentryError('Erro em getRecipient', error);
		return { error };
	}
}


const atividadesRules = {
	1: ['pre', 'atividade_indicacao', 'atividade_1'],
	2: [],
	3: ['pos'],
};

async function findAtividadesMissing(currentModule, alunoID) {
	const atividadesModulo = atividadesRules[currentModule];
	const respostas = await DB.getAlunoRespostasAll(alunoID);
	const areMissing = [];
	atividadesModulo.forEach((e) => {
		if (!respostas || respostas[e] === null) { areMissing.push(e); }
	});

	return areMissing;
}

async function replaceCustomParameters(original, recipient) {
	const alunaTurma = recipient.turmaName ? recipient.turmaName : await DB.getTurmaName(recipient.turma_id);
	const alunaCPF = recipient.cpf;
	const indicadoID = recipient.id && recipient.aluno_id ? recipient.id : 0;
	const customParamRules = [
		{ query: 'turma=', param: 'TURMARESPOSTA', data: alunaTurma },
		{ query: 'cpf=', param: 'CPFRESPOSTA', data: alunaCPF },
		{ query: 'indicaid=', param: 'IDRESPOSTA', data: indicadoID },
	];
	let url = original;

	customParamRules.forEach((e) => {
		if (url.includes(`${e.query}${e.param}`)) {
			if (e.data && e.data.toString().length > 0) {
				url = url.replace(new RegExp(e.param, 'g'), e.data);
			} else {
				url = url.replace(e.query + e.param, '');
			}
		}
	});

	// if url has only one param, remove & from query string
	if (url.match(/=/g).length === 1) url.replace('&', '');
	url = await help.getTinyUrl(url);
	return url;
}


// uses each key in data to replace globally keywords/mask on the text with the correct data
async function replaceDataText(original, data, recipient) {
	let text = original;
	for (let i = 0; i < Object.keys(data).length; i++) {
		const element = Object.keys(data)[i];
		let replace = data[element];
		if (replace && replace.length > 0) {
			const regex = new RegExp(`\\[${element}\\]`, 'gi'); // ignore casing, the var on the text may not be uppcase
			if (replace.includes('surveymonkey')) {
				replace = await replaceCustomParameters(replace, recipient);
			}
			text = text.replace(regex, replace);
		}
	}

	return text;
}

async function buildIndicadosLinks(alunaID, turmaID, column, link) {
	const indicados = await DB.getIndicadoRespostasAnswerNull(alunaID, column);
	if (!indicados || indicados.length === 0) return link;
	let result = '';
	for (let i = 0; i < indicados.length; i++) {
		const e = indicados[i];
		let aux = `${e.nome}:\n${link}`;
		aux = aux.replace('IDRESPOSTA', e.id);
		aux = aux.replace('TURMARESPOSTA', turmaID);
		result += `\n${aux}\n`;
	}
	return result;
}

const atividadesHumanName = {
	// atividade_indicacao: 'Indicação de Avaliadores (Avaliação 360)',
	atividade_1: 'Matrícula',
	pre: 'Pré Sondagem de foco',
	pos: 'Pós Sondagem de foco',
};

const atividadesLinks = {
	// atividade_indicacao: surveysInfo.indicacao360.link,
	pre: surveysInfo.sondagemPre.link,
	atividade_1: surveysInfo.atividade1.link,
	pos: surveysInfo.sondagemPre.link,
};

async function buildAtividadeText(recipient, atividades) {
	let text = '';

	for (let i = 0; i < atividades.length; i++) {
		const e = atividades[i];
		if (atividadesHumanName[e]) text += `${atividadesHumanName[e]}`;
		if (atividadesLinks[e]) text += ` - ${await replaceCustomParameters(atividadesLinks[e], recipient)}`;
		text += '\n';
	}

	return text;
}


/*
	fillMasks: checks which data is empty so that we can fill with dynamic data.
	Used in the mail handlers below.
*/
async function fillMasks(replaceMap, recipientData) {
	const result = {};
	for (let i = 0; i < replaceMap.length; i++) {
		let currentKey = replaceMap[i];
		if (!result[currentKey] && currentKey) { // check if that key has no value already
			currentKey = currentKey.toUpperCase(); // just to make sure, otherwise the var may not be found
			let newData = '';
			switch (currentKey) {
			case 'NOMEUM':
				if (recipientData['aluna.nome_completo']) { newData = recipientData['aluna.nome_completo']; }
				if (recipientData.nome_completo) { newData = recipientData.nome_completo; }
				break;
			case 'MODULO1':
				newData = await help.formatModulo(recipientData.mod1);
				break;
			case 'MODULO2':
				newData = await help.formatModulo(recipientData.mod2);
				break;
			case 'MODULO3':
				newData = await help.formatModulo(recipientData.mod3);
				break;
			case 'LOCAL':
				newData = recipientData.local;
				break;
			case 'FDSMOD1':
				newData = await help.formatFdsMod(recipientData.mod1);
				break;
			case 'FDSMOD2':
				newData = await help.formatFdsMod(recipientData.mod2);
				break;
			case 'FDSMOD3':
				newData = await help.formatFdsMod(recipientData.mod3);
				break;
			case 'TURMA':
				newData = recipientData.turmaName;
				if (!newData && recipientData.turma_id) newData = await DB.getTurmaName(recipientData.turma_id);
				break;
			case 'MOD1_PRE_1':
				newData = await help.formatDiasMod(recipientData.mod1, -1);
				break;
			case 'MOD2_PRE_1':
				newData = await help.formatDiasMod(recipientData.mod2, -1);
				break;
			case 'MOD3_PRE_1':
				newData = await help.formatDiasMod(recipientData.mod3, -1);
				break;
			case 'MOD1_PRE_2':
				newData = await help.formatDiasMod(recipientData.mod1, -2);
				break;
			case 'MOD2_PRE_2':
				newData = await help.formatDiasMod(recipientData.mod2, -2);
				break;
			case 'MOD3_PRE_2':
				newData = await help.formatDiasMod(recipientData.mod3, -2);
				break;
			case 'MOD1_PRE_3':
				newData = await help.formatDiasMod(recipientData.mod1, -3);
				break;
			case 'MOD2_PRE_3':
				newData = await help.formatDiasMod(recipientData.mod2, -3);
				break;
			case 'MOD3_PRE_3':
				newData = await help.formatDiasMod(recipientData.mod3, -3);
				break;
			case 'MOD1_PRE_5':
				newData = await help.formatDiasMod(recipientData.mod1, -5);
				break;
			case 'MOD2_PRE_5':
				newData = await help.formatDiasMod(recipientData.mod2, -5);
				break;
			case 'MOD3_PRE_5':
				newData = await help.formatDiasMod(recipientData.mod3, -5);
				break;
			case 'MOD1_PRE_6':
				newData = await help.formatDiasMod(recipientData.mod1, -6);
				break;
			case 'MOD2_PRE_6':
				newData = await help.formatDiasMod(recipientData.mod2, -6);
				break;
			case 'MOD3_PRE_6':
				newData = await help.formatDiasMod(recipientData.mod3, -6);
				break;
			case 'MOD1_PRE_7':
				newData = await help.formatDiasMod(recipientData.mod1, -7);
				break;
			case 'MOD2_PRE_7':
				newData = await help.formatDiasMod(recipientData.mod2, -7);
				break;
			case 'MOD3_PRE_7':
				newData = await help.formatDiasMod(recipientData.mod3, -7);
				break;
			case 'MOD1_PRE_8':
				newData = await help.formatDiasMod(recipientData.mod1, -8);
				break;
			case 'MOD2_PRE_8':
				newData = await help.formatDiasMod(recipientData.mod2, -8);
				break;
			case 'MOD3_PRE_8':
				newData = await help.formatDiasMod(recipientData.mod3, -8);
				break;
			case 'MOD1_PRE_9':
				newData = await help.formatDiasMod(recipientData.mod1, -9);
				break;
			case 'MOD2_PRE_9':
				newData = await help.formatDiasMod(recipientData.mod2, -9);
				break;
			case 'MOD3_PRE_9':
				newData = await help.formatDiasMod(recipientData.mod3, -9);
				break;
			case 'MOD1_PRE_13':
				newData = await help.formatDiasMod(recipientData.mod1, -13);
				break;
			case 'MOD2_PRE_13':
				newData = await help.formatDiasMod(recipientData.mod2, -13);
				break;
			case 'MOD3_PRE_13':
				newData = await help.formatDiasMod(recipientData.mod3, -13);
				break;
			case 'MOD1_PRE_14':
				newData = await help.formatDiasMod(recipientData.mod1, -14);
				break;
			case 'MOD2_PRE_14':
				newData = await help.formatDiasMod(recipientData.mod2, -14);
				break;
			case 'MOD3_PRE_14':
				newData = await help.formatDiasMod(recipientData.mod3, -14);
				break;
			case 'MOD1_POS_1':
				newData = await help.formatDiasMod(recipientData.mod1, 1);
				break;
			case 'MOD2_POS_1':
				newData = await help.formatDiasMod(recipientData.mod2, 1);
				break;
			case 'MOD3_POS_1':
				newData = await help.formatDiasMod(recipientData.mod3, 1);
				break;
			case 'MOD1_15DIAS':
				newData = await help.formatDiasMod(recipientData.mod1, -15);
				break;
			case 'MOD1_2DIAS':
				newData = await help.formatDiasMod(recipientData.mod1, -2);
				break;
			case 'MOD3_LASTDAY':
				newData = await help.formatDiasMod(recipientData.mod3, 1);
				break;
			case 'MOD3_2DIAS':
				newData = await help.formatDiasMod(recipientData.mod3, -2);
				break;
			case 'MOD3_7DIAS':
				newData = await help.formatDiasMod(recipientData.mod3, -7);
				break;
			case 'MODULOAVISAR':
				newData = recipientData.moduloAvisar ? recipientData.moduloAvisar.toString() : 'novo';
				break;
			case 'DATAHORA':
				newData = await help.formatModuloHora(recipientData.dataHora);
				break;
			case 'DATAHORA_1':
				newData = await help.formatModuloHora(recipientData.dataHora);
				break;
			case 'DATAHORA_2':
				newData = await help.formatModuloHora(recipientData.dataHora);
				break;
			case 'DATAHORA_3':
				newData = await help.formatModuloHora(recipientData.dataHora);
				break;
			case 'ATIVIDADESCOMPLETAS':
				newData = help.atividadesCompletas[recipientData.moduloAvisar || 3];
				break;
			case 'EMAILMENTORIA':
				newData = process.env.EMAILMENTORIA;
				break;
			case 'NUMBERWHATSAP':
				newData = process.env.NUMBERWHATSAP;
				break;
			case 'GRUPOWHATS':
				newData = await help.getTinyUrl(await DB.getWhatsappFromID(recipientData.turma_id));
				break;
			case 'LINKDONNA':
				newData = await help.getTinyUrl(process.env.LINK_DONNA);
				break;
			case 'DISC_LINK1':
			case 'DISC_LINK2':
			case 'DISC_LINK':
				newData = await help.getTinyUrl(await DB.getDISCFromID(recipientData.turma_id));
				break;
			case 'SONDAGEMPRE':
				newData = process.env.SONDAGEM_PRE_LINK;
				break;
			case 'SONDAGEMPOS':
				newData = process.env.SONDAGEM_POS_LINK;
				break;
			// case 'INDICACAO360':
			// 	newData = process.env.INDICACAO360_LINK;
			// 	break;
			// case 'AVALIADORPRE':
			// 	newData = await buildIndicadosLinks(recipientData.id, recipientData.turmaName, 'pre', process.env.AVALIADOR360PRE_LINK);
			// 	break;
			// case 'AVALIADORPOS':
			// 	newData = await buildIndicadosLinks(recipientData.id, recipientData.turmaName, 'pos', process.env.AVALIADOR360POS_LINK);
			// 	break;
			case 'AVALIACAO1':
				newData = process.env.MODULO1_LINK;
				break;
			case 'AVALIACAO2':
				newData = process.env.MODULO2_LINK;
				break;
			case 'AVALIACAO3':
				newData = process.env.MODULO3_LINK;
				break;
			case 'ATIVIDADES':
				newData = await buildAtividadeText(recipientData, recipientData.atividadesMissing);
				break;
			default: {
				const modDate = await help.buildModDateChange(currentKey);
				if (modDate && modDate.module && modDate.days) {
					newData = await help.formatDiasMod(recipientData[`mod${modDate.module}`], modDate.days);
				}
			}
				break;
			}
			result[currentKey] = newData;
		}
	}
	return result;
}

async function replaceParameters(texts, newMap, recipient) {
	const newTexts = texts;

	const objKeys = Object.keys(newTexts);
	for (let i = 0; i < objKeys.length; i++) { // replace the content in every kind of text we may have, e-mail subject or body, chatbot text, etc
		const element = objKeys[i];
		if (newTexts[element] && typeof newTexts[element] === 'string') {
			newTexts[element] = await replaceDataText(newTexts[element], newMap, recipient);
		}
	}
	return newTexts || {};
}

async function buildNewText(currentType, recipient) {
	try {
		const cloneType = await clone(currentType);

		const parametersMap = await rules.buildParametersRules(cloneType);
		const masks = await fillMasks(parametersMap, recipient);
		const res = replaceParameters(cloneType, masks, recipient);
		return res;
	} catch (error) {
		help.sentryError('Erro em buildNewText', { error, currentType, recipient });
		return null;
	}
}

async function buildAttachment(type) {
	try {
		const result = { mail: [], chatbot: {} };

		if (type.attachment_name) {
			result.mail.push({
				filename: `${type.attachment_name}.pdf`,
				content: fs.createReadStream(`${process.cwd()}/${type.attachment_name}.pdf`),
				contentType: 'application/pdf',
			});
		}

		return result;
	} catch (error) {
		help.sentryError('Erro em buildAttachment', { error });
		return null;
	}
}

async function sendMail(recipient, attach, newText) {
	try {
		if (!newText.email_text) return { sent: false, msg: 'não tem texto no e-mail para enviar nesse tipo de notificação' };

		const { email } = recipient;
		if (!email) return { sent: false, msg: 'Aluna não tem e-mail cadastrado' };

		let html = await fs.readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
		html = await html.replace('[CONTEUDO_MAIL]', newText.email_text); // add nome to mail template

		const error = await mailer.sendHTMLMail(newText.email_subject, recipient.email, html, attach.mail, newText.email_text);
		if (error) return { sent: false, error };

		return { sent: true };
	} catch (error) {
		help.sentryError('Erro em sendMail', { error });
		return { sent: false, error };
	}
}


async function sendChatbot(recipient, attach, newText) {
	try {
		if (!newText.chatbot_text) return { sent: false, msg: 'não tem texto no chatbot para enviar nesse tipo de notificação' };

		const FBID = recipient['chatbot.fb_id'];
		if (!FBID) return { sent: false, msg: 'Aluna não está vinculada no chatbot' };

		let error = await broadcast.sendBroadcastAluna(recipient['chatbot.fb_id'], newText.chatbot_text, newText.chatbot_quick_reply);
		if (!error && newText.chatbot_cards) { error = await broadcast.sendCardAluna(FBID, newText.chatbot_cards, recipient.cpf); }
		if (!error && [attach.chatbot.pdf || attach.chatbot.png]) { error = await broadcast.sendFiles(FBID, attach.chatbot.pdf, attach.chatbot.pdf2); }
		if (error) return { sent: false, error };

		return { sent: true };
	} catch (error) {
		help.sentryError('Erro em sendChatbot', { error });
		return { sent: false, error };
	}
}

module.exports = {
	getRecipient,
	findCurrentModulo,
	fillMasks,
	replaceParameters,
	findAtividadesMissing,
	buildAttachment,
	buildNewText,
	sendMail,
	sendChatbot,
	buildAtividadeText,
};
