const { Sequelize } = require('sequelize');
const notificationTypes = require('../server/models').notification_types;
const notificationQueue = require('../server/models').notification_queue;
const indicadosAvaliadores = require('../server/models').indicacao_avaliadores;
const turmas = require('../server/models').turma;
const help = require('./helper');
const DB = require('./DB_helper');
const rules = require('./notificationRules');
const aux = require('./notificationSend_aux');

const { Op } = Sequelize;


async function checkShouldSendNotification(notification, turma, tRules, today) {
	try {
		const currentRule = await tRules.find((x) => x.notification_type === notification.notification_type);
		if (!currentRule) throw new help.MyError('Não foi possível encontrar a regra para essa notificação', { currentRule, type: notification.notification_type });

		const moduloDate = new Date(turma[`modulo${currentRule.modulo}`]);	// the date of the module, uses the modulo linked to the rule to find the date saved on turma
		const dateToSend = await rules.getSendDate(turma, currentRule); // the date to actually send the notification

		// add date for the Reenvio of the notification
		if (notification.check_answered === true) dateToSend.setDate(dateToSend.getDate() + currentRule.reminderDate);

		const min = dateToSend;
		let max;
		if (dateToSend < moduloDate) { // notification will be sent before the moduloDate, today needs to be between the notification date and the moduleDate
			max = moduloDate;
		} else { // notification will be sent after the moduloDate
			const nextModule = currentRule.modulo + 1; // get next module, today needs to be between the notification date and the moduleDate from the next module
			if (nextModule <= 3) {
				max = new Date(turma[`modulo${nextModule}`]);
			} else { // if there's no next module, add a few days to the day of the module
				moduloDate.setDate(moduloDate.getDate() + 15);
				max = moduloDate;
			}
		}

		// ignore hours for most notifications
		// if ([14, 15, 31, 32].includes(notification.notification_type) !== true) {
		// 	max.setHours(0, 0, 0, 0);
		// 	min.setHours(0, 0, 0, 0);
		// 	today.setHours(0, 0, 0, 0);
		// }

		// console.log('max', max);
		// console.log('min', min);
		// console.log('today', today);

		if (!min || !max) throw new help.MyError('Não foi possível encontrar todas os valores necessários', { min, max, today, moduloDate, dateToSend, currentRule }); // eslint-disable-line object-curly-newline

		// add dates in which the notification should be sent
		const result = { min, max, today, sendNow: false }; // eslint-disable-line object-curly-newline
		// if today is inside the date range we can send the notification
		if (today >= min && today <= max) result.sendNow = true;
		return result;
	} catch (error) {
		help.sentryError('Erro em checkShouldSendNotification', { error, notification, turma, tRules, today }); // eslint-disable-line object-curly-newline
		return { error };
	}
}

async function checkShouldSendRecipient(recipient, notification, turma, today) {
	try {
		if (!recipient) { return false; }
		// indicados---
		// avaliação 360 pré - lembrete - check if pré was answered
		if ([3, 19].includes(notification.notification_type) === true && notification.check_answered === true) {
			const answerPre = recipient['respostas.pre'];
			if (answerPre && Object.keys(answerPre)) return { send: false, msg: 'Indicado já respondeu avaliação 360 pré' };
		}

		// avaliação 360 pós - check if pré was answered
		if ([9, 25].includes(notification.notification_type) === true) {
			const answerPre = recipient['respostas.pre'];
			if (!answerPre || Object.entries(answerPre).length === 0) return { send: false, msg: 'Indicado não respondeu nem a avaliação 360 pré' };

			// avaliação 360 pós - lembrete - check if pós was answered
			if (notification.check_answered === true) {
				const answerPos = recipient['respostas.pos'];
				if (answerPos && Object.entries(answerPos).length) return { send: false, msg: 'Indicado já respondeu pós' };
			}
		}

		// alunas---
		// check if aluna has anys indicados and if any of them didnt answer the avaliaçao
		if ([4, 10, 20, 26].includes(notification.notification_type)) {
			const column = [4, 20].includes(notification.notification_type) ? 'pre' : 'pos'; // select which questionario
			const avaliadores = await indicadosAvaliadores.findAll({ where: { aluno_id: recipient.id }, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro no findAll do indicadosAvaliadores', err));
			if (!avaliadores || avaliadores.length === 0) return { send: false, msg: 'Aluna não tem nenhum indicado' };

			const indicados = await DB.getIndicadoRespostasAnswerNull(recipient.id, column); // get indicados that didnt answer the questionario
			if (!indicados || indicados.length === 0) return { send: false, msg: 'Todos os indicados da aluna já responderam' };
		}

		// check if aluna is missing any questionario
		if ([16, 32].includes(notification.notification_type)) {
			const currentModule = await aux.findCurrentModulo(turma, today);
			const atividadesMissing = await aux.findAtividadesMissing(null, currentModule, recipient.id);
			if (!atividadesMissing || atividadesMissing.length === 0) return { send: false, msg: `Aluna já respondeu todos os questionários do módulo ${currentModule}` };
			// store all the questionarios the aluna didnt answer
			recipient.atividadesMissing = atividadesMissing;
		}

		return { send: true };
	} catch (error) {
		help.sentryError('Erro em checkShouldSendRecipient', { error, recipient, notification, turma, today }); // eslint-disable-line object-curly-newline
		return { send: false, error };
	}
}

async function actuallySendMessages(currentType, notification, recipient) {
	const res = {};
	try {
		const newText = await aux.buildNewText(currentType, recipient); res.newText = newText;
		if (!newText || (!newText.email_text && !newText.chatbot_text)) throw new help.MyError('Não foi possível montar os textos');
		const attach = await aux.buildAttachment(currentType); res.attach = attach;
		if (!attach || (!attach.mail && !attach.chatbot)) throw new help.MyError('Não foi possível montar os attachments');

		const mailAnswer = await aux.sendMail(recipient, attach, newText); res.mailAnswer = mailAnswer;
		if (mailAnswer.sent === true) await notificationQueue.update({ sent_at: new Date() }, { where: { id: notification.id } }).then((rowsUpdated) => rowsUpdated).catch((err) => help.sentryError('Erro no update do sendAt', err));

		const chatbotAnswer = await aux.sendChatbot(recipient, attach, newText); res.chatbotAnswer = chatbotAnswer;
		if (chatbotAnswer.sent === true) await notificationQueue.update({ sent_at_chatbot: new Date() }, { where: { id: notification.id } }).then((rowsUpdated) => rowsUpdated).catch((err) => help.sentryError('Erro no update do sendAt', err));

		return chatbotAnswer;
	} catch (error) {
		help.sentryError('Erro em actuallySendMessages', { currentType, notification, recipient });
		return { error, currentType, notification, recipient }; // eslint-disable-line object-curly-newline
	}
}

async function sendNotificationFromQueue() {
	const res = {};
	try {
		const queue = await notificationQueue.findAll({ where: { turma_id: { [Op.not]: null }, sent_at: null, error: null }, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro ao carregar notification_queue', err));

		const nTypes = await notificationTypes.findAll({ where: {}, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro ao carregar notification_types', err));
		if (!nTypes || nTypes.length === 0) throw new help.MyError('Não foram carregados os tipos de notificação', { nTypes });

		const allTurmas = await turmas.findAll({ where: {}, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro ao carregar turma', err));
		if (!allTurmas || allTurmas.length === 0) throw new help.MyError('Não foram carregadas as turmas', { allTurmas });

		const nRules = await rules.buildNotificationRules(); // get all rules from spreadsheet
		if (!nRules || !Object.keys(nRules) || Object.keys(nRules).length === 0) throw new help.MyError('Não foram carregadas as regras da planilha', { nRules });

		const today = new Date();

		for (let i = 0; i < queue.length; i++) {
			const notification = queue[i]; const cName = `n_${notification.id}`;
			try {
				const currentTurma = await allTurmas.find((x) => x.id === notification.turma_id);
				if (!currentTurma) { throw new help.MyError('Não foi possível encontrar a turma da notificação', { notification, allTurmas, currentTurma }); }

				const currentType = await nTypes.find((x) => x.id === notification.notification_type);
				if (!currentType) throw new help.MyError('Não foi possível encontrar o tipo de notificação atual', { currentType, notification });

				const currentRule = currentTurma.inCompany === true ? nRules.in_company : nRules.normal;
				if (!currentRule || currentRule.length === 0) throw new help.MyError('Não foram encontradas as regras para a turma');

				const shouldSend = await checkShouldSendNotification(notification, currentTurma, currentRule, today);
				if (!shouldSend || shouldSend.error) throw new help.MyError('Não foi possível descobrir se é hora de mandar a notificação', { shouldSend, notification, currentTurma, currentRule }); // eslint-disable-line object-curly-newline

				if (shouldSend.sendNow === true) {
					const recipient = await aux.getRecipient(notification, currentTurma);
					if (!recipient || recipient.error) throw new help.MyError('Não foi possível carregar os dados do recipiente', { recipient, notification, currentTurma });

					const shouldRecipient = await checkShouldSendRecipient(recipient, notification, currentTurma, today);
					if (!shouldRecipient || shouldRecipient.error) throw new help.MyError('Não foi possível descobrir se recipiente pode receber', { shouldRecipient });
					if (shouldRecipient.send === true) {
						const sentRes = await actuallySendMessages(currentType, notification, recipient);
						res[cName] = sentRes;
					} else {
						res[cName] = { msg: `Recipient não pode receber - ${shouldRecipient.smg}` }; // eslint-disable-line object-curly-newline
					}
				} else { // cant send this notificaition now
					res[cName] = { msg: 'Não é hora de mandar essa notificação', dataMin: shouldSend.min, dataMax: shouldSend.max, today: shouldSend.today }; // eslint-disable-line object-curly-newline
				}
			} catch (error) {
				res[cName] = error;
			}
		}
	} catch (error) {
		help.sentryError('Erro no sendNotificationFromQueue', error);
		return error;
	}

	return res;
}


module.exports = {
	checkShouldSendRecipient,
	checkShouldSendNotification,
	actuallySendMessages,
	sendNotificationFromQueue,
};
