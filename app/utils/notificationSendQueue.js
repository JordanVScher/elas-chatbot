const { createReadStream } = require('fs');
const { readFileSync } = require('fs');
const { Sequelize } = require('sequelize');
const notificationTypes = require('../server/models').notification_types;
const notificationQueue = require('../server/models').notification_queue;
const indicadosAvaliadores = require('../server/models').indicacao_avaliadores;
const notificationLog = require('../server/models').notification_log;
const aluno = require('../server/models').alunos;
const help = require('./helper');
const { sentryError } = require('./helper');
const mailer = require('./mailer');
const broadcast = require('./broadcast');
const DB = require('./DB_helper');
const rules = require('./notificationRules');
const surveysInfo = require('./sm_surveys');

const { Op } = Sequelize;

const atividadesRules = {
	1: ['pre', 'atividade_indicacao'],
	2: [],
	3: ['pos'],
};

async function findCurrentModulo(turmaData, today = new Date()) {
	let currentModule = 1;

	for (let i = 1; i <= 3; i++) {
		const moduleX = turmaData[`modulo${i}`];
		if (today >= new Date(moduleX)) { currentModule = i; }
	}

	return currentModule;
}

async function findAtividadesMissing(atividades, currentModule, alunoID) {
	const atividadesModulo = atividades[currentModule];
	const respostas = await DB.getAlunoRespostasAll(alunoID);
	const areMissing = [];
	atividadesModulo.forEach((e) => {
		if (respostas[e] === null) { areMissing.push(e); }
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
			const regex = new RegExp(`\\[${element}\\]`, 'g');
			if (replace.includes('surveymonkey')) {
				replace = await replaceCustomParameters(replace, recipient);
			}
			text = text.replace(regex, replace);
		}
	}

	return text;
}

async function buildIndicadosLinks(alunaID, turma, column, link) {
	const indicados = await DB.getIndicadoRespostasAnswerNull(alunaID, column);
	if (!indicados || indicados.length === 0) return link;
	let result = '';
	for (let i = 0; i < indicados.length; i++) {
		const e = indicados[i];
		let aux = `${e.nome}:\n${link}`;
		aux = aux.replace('IDRESPOSTA', e.id);
		aux = aux.replace('TURMARESPOSTA', turma);
		result += `\n${aux}\n`;
	}
	return result;
}

const atividadesHumanName = {
	atividade_indicacao: 'Indicação de Avaliadores (Avaliação 360)',
	pre: 'Pré Sondagem de foco',
	pos: 'Pós Sondagem de foco',
};

const atividadesLinks = {
	atividade_indicacao: surveysInfo.indicacao360.link,
	pre: surveysInfo.sondagemPre.link,
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
		const currentKey = replaceMap[i];
		if (!result[currentKey]) { // check if that key has no value already
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
			case 'INDICACAO360':
				newData = process.env.INDICACAO360_LINK;
				break;
			case 'AVALIADORPRE':
				newData = await buildIndicadosLinks(recipientData.id, recipientData.turmaName, 'pre', process.env.AVALIADOR360PRE_LINK);
				break;
			case 'AVALIADORPOS':
				newData = await buildIndicadosLinks(recipientData.id, recipientData.turmaName, 'pos', process.env.AVALIADOR360POS_LINK);
				break;
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

async function extendRecipient(recipient, moduleDates, turmaID) {
	const result = recipient;

	if (moduleDates && turmaID) {
		const ourTurma = await moduleDates.find((x) => x.id === turmaID);
		if (ourTurma.modulo1) { result.mod1 = ourTurma.modulo1; }
		if (ourTurma.modulo2) { result.mod2 = ourTurma.modulo2; }
		if (ourTurma.modulo3) { result.mod3 = ourTurma.modulo3; }
		if (ourTurma.local) { result.local = ourTurma.local; }

		const now = new Date(); // figure out which module the aluna is on
		if (ourTurma.modulo1 >= now) { result.moduloAvisar = 1; }
		if (ourTurma.modulo2 >= now) { result.moduloAvisar = 2; }
		if (ourTurma.modulo3 >= now) { result.moduloAvisar = 3; }
	}

	return result;
}

async function getIndicado(id, moduleDates) {
	const result = await indicadosAvaliadores.findByPk(id, { raw: true, include: ['respostas', 'aluna'] })
		.then((res) => res).catch((err) => sentryError('Erro ao carregar indicado', err));

	if (result && result.email) {
		if (result['aluna.turma_id']) { result.turmaName = await DB.getTurmaName(result['aluna.turma_id']); }
		return extendRecipient(result, moduleDates, result['aluna.turma_id']);
	}

	return sentryError('Erro: indicado não tem e-mail', result);
}

async function getAluna(id, moduleDates) {
	const result = await aluno.findByPk(id, { raw: true, include: ['chatbot'] })
		.then((res) => res).catch((err) => sentryError('Erro ao carregar aluno', err));

	if (result && (result.email || result['chatbot.fb_id'])) {
		if (result.turma_id) { result.turmaName = await DB.getTurmaName(result.turma_id); }
		return extendRecipient(result, moduleDates, result.turma_id);
	}

	return sentryError('Erro: aluno não tem e-mail', result);
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

async function checkShouldSendNotification(notification, moduleDates, today, notificationRules, logID) {
	const ourTurma = moduleDates.find((x) => x.id === notification.turma_id); // turma for this notification
	if (!ourTurma) return false;
	let currentRule = ''; // depends on the notification_type, rule for the notification (and module)
	if ([14, 31, 16].includes(notification.notification_type)) {
		const currentModule = await findCurrentModulo(moduleDates, today);
		currentRule = await notificationRules.find((x) => x.notification_type === notification.notification_type && x.modulo === currentModule);
	} else if ([15, 32].includes(notification.notification_type)) {
		const currentModule = await findCurrentModulo(moduleDates, today);
		let sunday = false;
		if (today.getDay() === 0) { sunday = true; }
		currentRule = await notificationRules.find((x) => x.notification_type === notification.notification_type && x.modulo === currentModule && x.sunday === sunday);
	} else {
		currentRule = await notificationRules.find((x) => x.notification_type === notification.notification_type);
	}

	await notificationLog.update({ notificationRules: currentRule }, { where: { id: logID } }).then((rowsUpdated) => rowsUpdated).catch((err) => sentryError('Erro no update do notificationLog1', err));

	if (!currentRule) {
		return false;
		// return sentryError('currentRule undefined!', JSON.stringify({ currentNotification: notification }, null, 2));
	}
	const dateToSend = await rules.getSendDate(ourTurma, currentRule); // the date to send
	const moduloDate = new Date(ourTurma[`modulo${currentRule.modulo}`]);

	if (notification.check_answered === true) {
		dateToSend.setDate(dateToSend.getDate() + currentRule.reminderDate);
	}

	const min = dateToSend;
	let max;

	if (dateToSend < moduloDate) { // notification will be sent before the moduloDate, today needs to be between the notification date and the moduleDate
		max = moduloDate;
	} else { // notification will be sent after the moduloDate
		const nextModule = currentRule.modulo + 1; // get next module, today needs to be between the notification date and the moduleDate rom the next module
		if (nextModule <= 3) {
			max = new Date(ourTurma[`modulo${nextModule}`]);
		} else { // if there's no next module, add a few days to the day of the module
			moduloDate.setDate(moduloDate.getDate() + 15);
			max = moduloDate;
		}
	}

	// ignore hours for most notifications
	if ([14, 16, 31, 32].includes(notification.notification_type) !== true) {
		max.setHours(0, 0, 0, 0);
		min.setHours(0, 0, 0, 0);
		today.setHours(0, 0, 0, 0);
	}

	// console.log('max', max);
	// console.log('min', min);
	// console.log('today', today);

	if (today >= min && today <= max) { // if today is inside the date range we can send the notification
		return true;
	}

	return false; // can't send this notification
}

async function checkShouldSendRecipient(recipient, notification, moduleDates, today) {
	if (!recipient) { return false; }
	if ([3, 19].includes(notification.notification_type) === true && notification.check_answered === true) {
		const answerPre = recipient['respostas.pre'];
		if (answerPre && Object.keys(answerPre)) { // if pre was already answered, there's no need to resend this notification
			await notificationQueue.update({ error: { misc: 'Indicado já respondeu pré', date: new Date() } }, { where: { id: notification.id } })
				.then((rowsUpdated) => rowsUpdated).catch((err) => sentryError('Erro no update do erro check_answered & 3', err));
			return false;
		}
	}

	if ([9, 26].includes(notification.notification_type) === true) { // if it's this type of notification, check if recipient has answered the pre-avaliacao
		const answerPre = recipient['respostas.pre'];
		if (!answerPre || Object.entries(answerPre).length === 0) {
			await notificationQueue.update({ error: { misc: 'Indicado não respondeu pré-avaliação', date: new Date() } }, { where: { id: notification.id } })
				.then((rowsUpdated) => rowsUpdated).catch((err) => sentryError('Erro no update do erro === 10', err));
			return false;
		}

		if (notification.check_answered === true) { // check if we need to see if recipient answered pos already
			const answerPos = recipient['respostas.pos'];
			if (answerPos && Object.entries(answerPos).length !== 0) { // if pos was already answered, there's no need to resend this notification
				await notificationQueue.update({ error: { misc: 'Indicado já respondeu pós', date: new Date() } }, { where: { id: notification.id } })
					.then((rowsUpdated) => rowsUpdated).catch((err) => sentryError('Erro no update do erro check_answered & 9', err));
				return false;
			}
		}
	}

	// these two notifications are for alunos only, check if any of their indicados havent answered the pre/pos quiz already
	if ([4, 10, 20, 27].includes(notification.notification_type)) {
		const column = [4, 20].includes(notification.notification_type) ? 'pre' : 'pos'; // select which questionario
		const indicados = await DB.getIndicadoRespostasAnswerNull(recipient.id, column); // get indicados that didnt answer the current questionario
		if (!indicados || indicados.length === 0) { // if every indiciado answered, dont send email
			await notificationQueue.update({ error: { misc: 'Todos os indicados já responderam', date: new Date() } }, { where: { id: notification.id } })
				.then((rowsUpdated) => rowsUpdated).catch((err) => sentryError('Erro no update do erro do 4 e 10', err));
			return false;
		}
	}

	if ([16].includes(notification.notification_type)) {
		const currentModule = await findCurrentModulo(moduleDates, today);
		const atividadesMissing = await findAtividadesMissing(atividadesRules, currentModule, recipient.id);
		if (!atividadesMissing || atividadesMissing.length === 0) {
			await notificationQueue.update({ error: { misc: `Aluna já respondeu todos os questionários do módulo ${currentModule}`, date: new Date() } }, { where: { id: notification.id } })
				.then((rowsUpdated) => rowsUpdated).catch((err) => sentryError('Erro no update da checagem do tipo 16', err));
			return false;
		}
		recipient.atividadesMissing = atividadesMissing;
	}

	return true;
}

async function buildAttachment(type, cpf, name) { // eslint-disable-line
	const result = { mail: [], chatbot: {} };

	if (type.attachment_name) {
		result.mail.push({
			filename: `${type.attachment_name}.pdf`,
			content: createReadStream(`${process.cwd()}/${type.attachment_name}.pdf`),
			contentType: 'application/pdf',
		});
	}

	return result;
}

async function actuallySendMessages(types, notification, recipient, logID) {
	let currentType = types.find((x) => x.id === notification.notification_type); // get the correct kind of notification
	currentType = JSON.parse(JSON.stringify(currentType)); // makes an actual copy
	const parametersMap = await rules.buildParametersRules(currentType);
	const masks = await fillMasks(parametersMap, recipient);

	await notificationLog.update({ masks }, { where: { id: logID } }).then((rowsUpdated) => rowsUpdated).catch((err) => sentryError('Erro no update do notificationLog1', err));

	const newText = await replaceParameters(currentType, masks, recipient);
	const attachment = await buildAttachment(currentType, recipient.cpf, recipient.nome_completo);
	const error = {};

	if (newText.email_text && recipient.email && recipient.email.trim()) { // if there's an email to send, send it
		let html = await readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
		html = await html.replace('[CONTEUDO_MAIL]', newText.email_text); // add nome to mail template
		const mailError = await mailer.sendHTMLMail(newText.email_subject, recipient.email, html, attachment.mail);
		if (mailError) { // save the error, if it happens
			error.mailError = mailError.toString();
			await notificationLog.update({ sentEmail: mailError.toString() }, { where: { id: logID } }).then((rowsUpdated) => rowsUpdated).catch((err) => sentryError('Erro no update do notificationLog1', err));
		} else {
			await notificationLog.update({ sentEmail: JSON.stringify({ status: 'Enviado', data: new Date() }, null, 2) }, { where: { id: logID } }).then((rowsUpdated) => rowsUpdated).catch((err) => sentryError('Erro no update do notificationLog1', err));
		}
	}

	if (recipient['chatbot.fb_id'] && newText.chatbot_text) { // if aluna is linked with messenger we send a message to the bot
		let chatbotError = await broadcast.sendBroadcastAluna(recipient['chatbot.fb_id'], newText.chatbot_text, newText.chatbot_quick_reply);
		if (!chatbotError && newText.chatbot_cards) { chatbotError = await broadcast.sendCardAluna(recipient['chatbot.fb_id'], newText.chatbot_cards, recipient.cpf); }
		if (!chatbotError && [attachment.chatbot.pdf || attachment.chatbot.png]) { chatbotError = await broadcast.sendFiles(recipient['chatbot.fb_id'], attachment.chatbot.pdf, attachment.chatbot.pdf2); }
		if (chatbotError) { error.chatbotError = chatbotError.toString(); } // save the error, if it happens
		if (chatbotError) { // save the error, if it happens
			error.chatbotError = chatbotError.toString();
			await notificationLog.update({ sentBroadcast: chatbotError.toString() }, { where: { id: logID } }).then((rowsUpdated) => rowsUpdated).catch((err) => sentryError('Erro no update do notificationLog1', err));
		} else {
			await notificationLog.update({ sentBroadcast: JSON.stringify({ status: 'Enviado', data: new Date() }, null, 2) }, { where: { id: logID } }).then((rowsUpdated) => rowsUpdated).catch((err) => sentryError('Erro no update do notificationLog1', err));
		}
	}

	if (!error.mailError && !error.chatbotError) { // if there wasn't any errors, we can update the queue succesfully
		await notificationQueue.update({ sent_at: new Date() }, { where: { id: notification.id } })
			.then((rowsUpdated) => rowsUpdated).catch((err) => sentryError('Erro no update do sendAt', err));
	} else { // if there was any errors, we store what happened
		await notificationQueue.update({ error, sent_at: new Date() }, { where: { id: notification.id } })
			.then((rowsUpdated) => rowsUpdated).catch((err) => sentryError('Erro no update do erro', err));
	}
	return false;
}

async function getRecipient(notification, moduleDates) {
	let recipient;
	if (notification.aluno_id && !notification.indicado_id) { // if notification doesnt have indicado_id it's just an aluno notification
		recipient = await getAluna(notification.aluno_id, moduleDates);
	} else if (notification.indicado_id) {
		recipient = await getIndicado(notification.indicado_id, moduleDates);
	}

	return recipient;
}
async function sendNotificationFromQueue(alunoID = null, test = false) {
	const moduleDates = await DB.getModuloDates();
	const today = new Date();

	const queryRules = { turma_id: { [Op.not]: null }, sent_at: null, error: null };
	if (alunoID) { queryRules.aluno_id = alunoID; }

	const queue = await notificationQueue.findAll({ where: queryRules, raw: true }) // eslint-disable-line
		.then((res) => res).catch((err) => sentryError('Erro ao carregar notification_queue', err));

	const types = await notificationTypes.findAll({ where: {}, raw: true })
		.then((res) => res).catch((err) => sentryError('Erro ao carregar notification_types', err));

	for (let i = 0; i < queue.length; i++) {
		const notification = queue[i];
		const logID = await notificationLog.create({ notificationId: notification.id, notificationType: Notification.notification_type }).then((res) => (res && res.dataValues && res.dataValues.id ? res.dataValues.id : false)).catch((err) => sentryError('Erro em notificationQueue.create', err));
		const turmaName = await DB.getTurmaName(notification.turma_id);
		const turmaInCompany = await DB.getTurmaInCompany(notification.turma_id);
		const regularRules = await rules.buildNotificationRules(turmaInCompany);
		const notificationRules = await rules.getNotificationRules(turmaName, regularRules);

		if (await checkShouldSendNotification(notification, moduleDates, today, notificationRules, logID) === true || test) { // !== for easy testing
			const recipientData = await getRecipient(notification, moduleDates);
			await notificationLog.update({ recipientData }, { where: { id: logID } }).then((rowsUpdated) => rowsUpdated).catch((err) => sentryError('Erro no update do notificationLog1', err));
			if (await checkShouldSendRecipient(recipientData, notification, moduleDates, today) === true) {
				await notificationLog.update({ shouldSend: true }, { where: { id: logID } }).then((rowsUpdated) => rowsUpdated).catch((err) => sentryError('Erro no update do notificationLog1', err));
				await actuallySendMessages(types, notification, recipientData, logID, test);
			}
		}
	}
}


module.exports = {
	sendNotificationFromQueue,
	checkShouldSendRecipient,
	checkShouldSendNotification,
	findCurrentModulo,
	getAluna,
	getIndicado,
	replaceParameters,
	buildAttachment,
	fillMasks,
	actuallySendMessages,
	getRecipient,
};
