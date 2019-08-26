const { CronJob } = require('cron');
const { createReadStream } = require('fs');
const { readFileSync } = require('fs');
const notificationTypes = require('../server/models').notification_types;
const notificationQueue = require('../server/models').notification_queue;
const indicadosAvaliadores = require('../server/models').indicacao_avaliadores;
const aluno = require('../server/models').alunos;
const help = require('./helper');
const { sentryError } = require('./helper');
const mailer = require('./mailer');
const charts = require('./charts');
const broadcast = require('./broadcast');
const { getModuloDates } = require('./DB_helper');
const { getTurmaName } = require('./DB_helper');
const rules = require('./notificationRules');

const parametersRules = {
	1: {
		GRUPOWHATS: process.env.GRUPOWHATSAP,
		LINKDONNA: process.env.LINK_DONNA,
		MODULO1: '',
		LOCAL: '',
		FDSMOD1: '',
		FDSMOD2: '',
		FDSMOD3: '',
	},
	2: {
		SONDAGEMPRE: process.env.SONDAGEM_PRE_LINK,
		INDICACAO360: process.env.INDICACAO360_LINK,
		DISC_LINK: process.env.DISC_LINK1,
		LINKDONNA: process.env.LINK_DONNA,
		TURMA: '',
		MOD1_15DIAS: '',
		MOD1_2DIAS: '',
	},
	3: { AVALIADORPRE: process.env.AVALIADOR360PRE_LINK, MOD1_2DIAS: '' },
	4: { AVALIADORPRE: process.env.AVALIADOR360PRE_LINK, MOD1_2DIAS: '' },
	5: { AVALIACAO1: process.env.MODULO1_LINK },
	6: { LINKDONNA: process.env.LINK_DONNA },
	7: {
		EMAILMENTORIA: process.env.EMAILMENTORIA,
		MOD3_LASTDAY: '',
		MOD3_2DIAS: '',
	},
	8: { AVALIACAO2: process.env.MODULO2_LINK },
	9: {
		SONDAGEMPOS: process.env.SONDAGEM_POS_LINK,
		DISC_LINK: process.env.DISC_LINK2,
		TURMA: '',
		MOD3_7DIAS: '',
	},
	10: {
		AVALIADORPOS: process.env.AVALIADOR360POS_LINK,
		MOD3_7DIAS: '',
	},
	11: {
		MOD3_7DIAS: '',
		AVALIADORPOS: process.env.AVALIADOR360POS_LINK,
		MOD3_LASTDAY: '',
	},
	12: {
		NUMBERWHATSAP: process.env.NUMBERWHATSAP,
		MOD3_LASTDAY: '',
	},
	13: { AVALIACAO3: process.env.MODULO3_LINK },
	14: { AVALIACAO3: process.env.MODULO3_LINK },
	15: {
		MODULOAVISAR: '', LOCAL: '', DATAHORA: '', ATIVIDADESCOMPLETAS: '',
	},
	16: {},
};

// uses each key in data to replace globally keywords/mask on the text with the correct data
async function replaceDataText(original, data) {
	let text = original;
	Object.keys(data).forEach(async (element) => {
		if (data[element] && data[element].length > 0) {
			const regex = new RegExp(`\\[${element}\\]`, 'g');
			text = text.replace(regex, data[element]);
		}
	});

	return text;
}

async function replaceCustomParameters(original, recipient) {
	const alunaTurma = await getTurmaName(recipient.turma_id);
	const alunaCPF = recipient.cpf;
	const indicadoID = recipient.id && recipient.aluno_id ? recipient.id : 0;
	let text = original;

	if (text.includes('turma=TURMARESPOSTA')) {
		if (alunaTurma && alunaTurma.toString().length > 0) {
			text = text.replace(/TURMARESPOSTA/g, alunaTurma);
		} else {
			text = text.replace('turma=TURMARESPOSTA', '');
		}
	}

	if (text.includes('cpf=CPFRESPOSTA')) {
		if (alunaCPF && alunaCPF.toString().length > 0) {
			text = text.replace(/CPFRESPOSTA/g, alunaCPF);
		} else {
			text = text.replace('cpf=CPFRESPOSTA', '');
		}
	}

	if (text.includes('indicaid=IDRESPOSTA')) {
		if (indicadoID && indicadoID.toString().length > 0) {
			text = text.replace(/IDRESPOSTA/g, indicadoID);
		} else {
			text = text.replace('indicaid=IDRESPOSTA', '');
		}
	}

	if ((text.includes('www') && text.match(/=/g)).length === 1) {
		text.replace('&', '');
	}

	return text;
}
/*
	fillMasks: checks which data is empty so that we can fill with dynamic data.
	Used in the mail handlers below.
*/
async function fillMasks(replaceMap, recipientData) {
	const result = replaceMap;
	result.NOMEUM = ''; // alsways add NOMEUM because it appears on most notifications
	const mapKeys = Object.keys(replaceMap);

	for (let i = 0; i < mapKeys.length; i++) {
		const currentKey = mapKeys[i];

		if (!result[currentKey]) { // check if that key has no value already
			let newData = '';
			switch (currentKey) {
			case 'NOMEUM':
				if (recipientData['aluna.nome_completo']) { newData = recipientData['aluna.nome_completo'];	}
				if (recipientData.nome_completo) { newData = recipientData.nome_completo;	}
				break;
			case 'MODULO1':
				newData = await help.formatModulo1(recipientData.mod1);
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
				newData = help.atividadesCompletas[recipientData.moduloAvisar];
				break;
			default:
				break;
			}
			result[currentKey] = newData;
		}
	}
	return result;
}

async function extendRecipient(recipient, moduleDates, turmaID) {
	const result = recipient;

	const ourTurma = await moduleDates.find(x => x.id === turmaID);
	if (ourTurma.modulo1) { result.mod1 = ourTurma.modulo1; }
	if (ourTurma.modulo2) { result.mod2 = ourTurma.modulo2; }
	if (ourTurma.modulo3) { result.mod3 = ourTurma.modulo3; }
	if (ourTurma.local) { result.local = ourTurma.local; }

	const now = new Date(); // figure out which module the aluna is on
	if (ourTurma.modulo1 >= now) { result.moduloAvisar = 1;	}
	if (ourTurma.modulo2 >= now) { result.moduloAvisar = 2;	}
	if (ourTurma.modulo3 >= now) { result.moduloAvisar = 3;	}

	return result;
}

async function getIndicado(id, moduleDates) {
	const result = await indicadosAvaliadores.findByPk(id, { raw: true, include: ['respostas', 'aluna'] })
		.then(res => res).catch(err => sentryError('Erro ao carregar indicado', err));

	if (result && result.email) {
		return extendRecipient(result, moduleDates, result['aluna.turma_id']);
	}

	return sentryError('Erro: indicado não tem e-mail', result);
}

async function getAluna(id, moduleDates) {
	const result = await aluno.findByPk(id, { raw: true, include: ['chatbot'] })
		.then(res => res).catch(err => sentryError('Erro ao carregar aluno', err));

	if (result && (result.email || result['chatbot.fb_id'])) {
		if (result.turma) { result.turmaName = await getTurmaName(result.turma); }
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
			newTexts[element] = await replaceCustomParameters(await replaceDataText(newTexts[element], newMap), recipient);
		}
	}
	return newTexts || {};
}


async function checkShouldSendNotification(notification, moduleDates, today) {
	const ourTurma = moduleDates.find(x => x.id === notification.turma_id); // turma for this notification
	const currentRule = rules.notificationRules.find(x => x.notification_type === notification.notification_type); // rule for this notification
	const dateToSend = await rules.getSendDate(ourTurma, currentRule); // the date to send

	const moduloDate = new Date(ourTurma[`modulo${currentRule.modulo}`]);

	const min = dateToSend;
	let	max;

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

	if (today >= min && today <= max) { // if today is inside the date range we can send the notification
		return true;
	}

	return false; // can't send this notification
}

async function checkShouldSendRecipient(recipient, notification) {
	if (!recipient) { return false;	}
	if (notification.notification_type === 3 && notification.check_answered === true) {
		const answerPre = recipient['respostas.pre'];
		if (answerPre && Object.keys(answerPre)) { // if pre was already answered, there's no need to resend this notification
			await notificationQueue.update({ error: { misc: 'Indicado já respondeu pré' } }, { where: { id: notification.id } })
				.then(rowsUpdated => rowsUpdated).catch(err => sentryError('Erro no update do erro check_answered & 3', err));
			return false;
		}
	}

	if (notification.notification_type === 10) { // if it's this type of notification, check if recipient has answered the pre-avaliacao
		const answerPre = recipient['respostas.pre'];
		if (!answerPre || Object.entries(answerPre).length === 0) {
			await notificationQueue.update({ error: { misc: 'Indicado não respondeu pré-avaliação' } }, { where: { id: notification.id } })
				.then(rowsUpdated => rowsUpdated).catch(err => sentryError('Erro no update do erro === 10', err));
			return false;
		}

		if (notification.check_answered === true) { // check if we need to see if recipient answered pos already
			const answerPos = recipient['respostas.pos'];
			if (answerPos && Object.entries(answerPos).length !== 0) { // if pos was already answered, there's no need to resend this notification
				await notificationQueue.update({ error: { misc: 'Indicado já respondeu pós' } }, { where: { id: notification.id } })
					.then(rowsUpdated => rowsUpdated).catch(err => sentryError('Erro no update do erro check_answered & 10', err));
				return false;
			}
		}
	}

	return true;
}

async function buildAttachment(type, cpf) {
	const result = { mail: [], chatbot: {} };

	if (type.attachment_name) {
		result.mail.push({
			filename: `${type.attachment_name}.pdf`,
			content: createReadStream(`${process.cwd()}/${type.attachment_name}.pdf`),
			contentType: 'application/pdf',
		});
	}

	if (type.id.toString() === '13' && cpf) {
		const pdf = { filename: `${cpf}_360Results.pdf` };
		const { filename } = await charts.buildIndicadoChart(cpf); // actually path
		pdf.content = filename || false;

		if (pdf && pdf.content) {
			result.mail.push({
				filename: pdf.filename,
				content: createReadStream(pdf.content),
				contentType: 'application/pdf',
			});

			result.chatbot.pdf = pdf;
		}

		const png = { filename: `${cpf}_sondagem.png` };
		png.content = await charts.buildAlunoChart(cpf); // actually buffer

		if (png && png.content) {
			result.mail.push({
				filename: png.filename,
				content: png.content,
				contentType: 'image/png',
			});

			result.chatbot.png = png;
		}
	}


	return result;
}

async function sendNotificationFromQueue() {
	const moduleDates = await getModuloDates();
	const today = new Date();

	const queue = await notificationQueue.findAll({ where: { sent_at: null, error: null }, raw: true })
		.then(res => res).catch(err => sentryError('Erro ao carregar notification_queue', err));

	const types = await notificationTypes.findAll({ where: {}, raw: true })
		.then(res => res).catch(err => sentryError('Erro ao carregar notification_types', err));

	for (let i = 0; i < queue.length; i++) {
		const notification = queue[i];

		if (await checkShouldSendNotification(notification, moduleDates, today) === true) {
			let recipient;
			if (notification.aluno_id) {
				recipient = await getAluna(notification.aluno_id, moduleDates);
			} else if (notification.indicado_id) {
				recipient = await getIndicado(notification.indicado_id, moduleDates);
			}

			if (await checkShouldSendRecipient(recipient, notification) === true) {
				const currentType = types.find(x => x.id === notification.notification_type); // get the correct kind of notification
				const map = parametersRules[currentType.id]; // get the respective map
				const newText = await replaceParameters(currentType, await fillMasks(map, recipient), recipient);
				const attachment = await buildAttachment(currentType, recipient.cpf);
				const error = {};
				if (newText.email_text) { // if there's an email to send, send it
					let html = await readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
					html = await html.replace('[CONTEUDO_MAIL]', newText.email_text); // add nome to mail template
					const mailError = await mailer.sendHTMLMail(newText.email_subject, recipient.email, html, attachment.mail);
					if (mailError) { error.mailError = mailError.toString(); } // save the error, if it happens
				}

				if (recipient['chatbot.fb_id'] && newText.chatbot_text) { // if aluna is linked with messenger we send a message to the bot
					let chatbotError = await broadcast.sendBroadcastAluna(recipient['chatbot.fb_id'], newText.chatbot_text, newText.chatbot_quick_reply);
					if (!chatbotError && newText.chatbot_cards) { chatbotError = await broadcast.sendCardAluna(recipient['chatbot.fb_id'], newText.chatbot_cards, recipient.cpf); }
					if (!chatbotError && [attachment.chatbot.pdf || attachment.chatbot.png]) { chatbotError = await broadcast.sendFiles(recipient['chatbot.fb_id'], attachment.chatbot.pdf, attachment.chatbot.png); }
					if (chatbotError) { error.chatbotError = chatbotError.toString(); } // save the error, if it happens
				}

				if (!error.mailError && !error.chatbotError) { // if there wasn't any errors, we can update the queue succesfully
					await notificationQueue.update({ sent_at: new Date() }, { where: { id: notification.id } })
						.then(rowsUpdated => rowsUpdated).catch(err => sentryError('Erro no update do sendAt', err));
				} else { // if there was any errors, we store what happened
					await notificationQueue.update({ error }, { where: { id: notification.id } })
						.then(rowsUpdated => rowsUpdated).catch(err => sentryError('Erro no update do erro', err));
				}
			}
		}
	}
}

const sendNotificationCron = new CronJob(
	'00 * 8-22/1 * * *', async () => {
	// '00 00 8-22/1 * * *', async () => {
		// console.log('Running sendNotificationCron');
		await sendNotificationFromQueue();
	}, (() => {
		console.log('Crontab sendNotificationCron stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo', false,
	false, // runOnInit = true useful only for tests
);

module.exports = {
	sendNotificationCron, checkShouldSendRecipient, checkShouldSendNotification, sendNotificationFromQueue,
};
