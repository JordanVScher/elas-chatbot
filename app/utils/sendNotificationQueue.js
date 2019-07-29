const { CronJob } = require('cron');
const { createReadStream } = require('fs');
const notificationTypes = require('../server/models').notification_types;
const notificationQueue = require('../server/models').notification_queue;
const indicadosAvaliadores = require('../server/models').indicacao_avaliadores;
const aluno = require('../server/models').alunos;
const help = require('./helper');
const mailer = require('./mailer');
const charts = require('./charts');
const broadcast = require('./broadcast');

const parametersRules = {
	// notification_id: map
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
	const alunaTurma = recipient.turma;
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
				newData = recipientData.turma;
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

async function getModuleDates() {
	const result = {};
	let spreadSheet = await help.getFormatedSpreadsheet();
	spreadSheet = spreadSheet.filter(x => x.turma && x.datahora1 && x.datahora2 && x.datahora3);

	spreadSheet.forEach(async (element) => {
		result[element.turma] = {
			modulo1: element.datahora1, modulo2: element.datahora2, modulo3: element.datahora3, local: element.local,
		};
	});

	return result;
}

async function extendRecipient(recipient, moduleDates, turma) {
	const result = recipient;
	const ourTurma = moduleDates[turma];
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
	const result = await indicadosAvaliadores.findByPk(id, { raw: true, include: ['respostas', 'aluna'] }).then(res => res).catch((err) => {
		console.log('Erro ao carregar indicado', err); help.Sentry.captureMessage('Erro ao carregar indicado');
		return false;
	});

	if (result && result.email) {
		return extendRecipient(result, moduleDates, result['aluna.turma']);
	}

	console.log('Erro: indicado não tem e-mail', JSON.stringify(result, null, 2)); help.Sentry.captureMessage('Erro: indicado não tem e-mail');
	return false;
}

async function getAluna(id, moduleDates) {
	const result = await aluno.findByPk(id, { raw: true, include: ['chatbot'] }).then(res => res).catch((err) => {
		console.log('Erro ao carregar aluno', err); help.Sentry.captureMessage('Erro ao carregar indicado');
		return false;
	});

	if (result && (result.email || result['chatbot.fb_id'])) {
		return extendRecipient(result, moduleDates, result.turma);
	}

	console.log('Erro: indicado não tem e-mail', JSON.stringify(result, null, 2)); help.Sentry.captureMessage('Erro: indicado não tem e-mail');
	return false;
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

async function checkShouldSendNotification(notification, today) {
	if (!notification) { return false;	}
	console.log(notification);
	const toSend = help.moment(notification.when_to_send); // get moment to send the notification
	const diffDays = toSend.diff(today, 'days'); // difference between today and the day the notification has to be sent, negative number -> time before the date

	if (diffDays !== 0 && notification.notification_type !== 15) { return false;	} // if it's not "today", don't send this notification yet (except for type 15)

	// for this type of notiication, we also have to check if the hour difference isnt bigger than 24 (diffDays can be -1 or 0)
	if (notification.notification_type === 15 && (diffDays === 0 || diffDays === -1)) {
		const diffHour = toSend.diff(today, 'hours');
		// example: toSend = 07/25 - 18:00, today has to be either 24 or 25, hour can be 18+ but can't be 17-
		if (!(diffHour >= -24)) { return false;	}
	} else if (notification.notification_type === 16) {
		const diffHour = toSend.diff(today, 'hours');
		if (!(diffHour === -1 || diffHour === 0)) { return false; } // one hour before or at the same hour: true
	}

	return true;
}
async function checkShouldSendRecipient(recipient, notification) {
	if (!recipient) { return false;	}
	if (notification.notification_type.toString() === '10') { // if it's this type of notification, check if recipient has answered the pre-avaliacao
		const answerPre = recipient['respostas.pre'];
		if (!answerPre || !Object.keys(answerPre)) {
			notificationQueue.update({ error: { misc: 'Indicado não respondeu pré-avaliação' } }, { where: { id: notification.id } }).then(rowsUpdated => rowsUpdated).catch((err) => {
				console.log('Erro no update do erro', err); help.Sentry.captureMessage('Erro no update do erro');
			});

			return false;
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
	const moduleDates = await getModuleDates();
	const today = new Date();

	const queue = await notificationQueue.findAll({
		where: { sent_at: null, error: null }, raw: true,
	}).then(res => res).catch((err) => {
		console.log('Erro ao carregar notification_queue', err); help.Sentry.captureMessage('Erro ao carregar notification_queue');
		return false;
	});

	const types = await notificationTypes.findAll({
		where: {}, raw: true,
	}).then(res => res).catch((err) => {
		console.log('Erro ao carregar notification_types', err); help.Sentry.captureMessage('Erro ao carregar notification_types');
		return false;
	});

	for (let i = 0; i < queue.length; i++) {
		const notification = queue[i];
		if (await checkShouldSendNotification(notification, today) === true) {
			let recipient;
			if (notification.aluno_id) {
				recipient = await getAluna(notification.aluno_id, moduleDates);
			} else if (notification.indicado_id) {
				recipient = await getIndicado(notification.indicado_id, moduleDates);
			}

			if (await checkShouldSendRecipient(recipient, notification)) {
				const currentType = types.find(x => x.id === notification.notification_type); // get the correct kind of notification
				const map = parametersRules[currentType.id]; // get the respective map
				const newText = await replaceParameters(currentType, await fillMasks(map, recipient), recipient);
				const attachment = await buildAttachment(currentType, recipient.cpf);
				const error = {};
				if (newText.email_text) { // if there's an email to send, send it
					const mailError = await mailer.sendHTMLMail(newText.email_subject, recipient.email, newText.email_text, attachment.mail);
					if (mailError) { error.mailError = mailError.toString(); } // save the error, if it happens
				}

				if (recipient['chatbot.fb_id'] && newText.chatbot_text) { // if aluna is linked with messenger we send a message to the bot
					let chatbotError = await broadcast.sendBroadcastAluna(recipient['chatbot.fb_id'], newText.chatbot_text, newText.chatbot_quick_reply);
					if (!chatbotError && newText.chatbot_cards) { chatbotError = await broadcast.sendCardAluna(recipient['chatbot.fb_id'], newText.chatbot_cards, recipient.cpf); }
					if (!chatbotError && [attachment.chatbot.pdf || attachment.chatbot.png]) { chatbotError = await broadcast.sendFiles(recipient['chatbot.fb_id'], attachment.chatbot.pdf, attachment.chatbot.png); }
					if (chatbotError) { error.chatbotError = chatbotError.toString(); } // save the error, if it happens
				}

				if (!error.mailError && !error.chatbotError) { // if there wasn't any errors, we can update the queue succesfully
					notificationQueue.update({ sent_at: new Date() }, { where: { id: notification.id } }).then(rowsUpdated => rowsUpdated).catch((err) => {
						console.log('Erro no update do sendAt', err); help.Sentry.captureMessage('Erro no update do sendAt');
					});
				} else { // if there was any errors, we store what happened
					notificationQueue.update({ error }, { where: { id: notification.id } }).then(rowsUpdated => rowsUpdated).catch((err) => {
						console.log('Erro no update do erro', err); help.Sentry.captureMessage('Erro no update do erro');
					});
				}
			}
		}
	}
}

const sendNotificationCron = new CronJob(
	'00 00 8-22/1 * * *', async () => {
		console.log('Running sendNotificationCron');
		await sendNotificationFromQueue();
	}, (() => {
		console.log('Crontab sendNotificationCron stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo', false,
	false, // runOnInit = true useful only for tests
);

module.exports = {
	sendNotificationCron,
}
;