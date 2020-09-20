const { Op } = require('sequelize').Sequelize;
const notificationTypes = require('../server/models').notification_types;
const notificationQueue = require('../server/models').notification_queue;
const turmas = require('../server/models').turma;
const help = require('./helper');
const rules = require('./notificationRules');
const aux = require('./notificationSend_aux');


async function checkShouldSendNotification(notification, turma, tRules, today) {
	try {
		const details = notification.additional_details || {};
		let currentRule = null;

		delete details.original_type;
		const keys = Object.keys(details);

		if (!keys.length || details.familiar) {
			currentRule = await tRules.find((x) => x.notification_type === notification.notification_type);
		} else if (details.modulo && typeof details.sunday === 'undefined') {
			currentRule = await tRules.find((x) => x.notification_type === notification.notification_type && x.modulo === details.modulo);
		} else if (details.modulo && typeof details.sunday !== 'undefined') {
			currentRule = await tRules.find((x) => x.notification_type === notification.notification_type && x.modulo === details.modulo && x.sunday === details.sunday);
		}

		if (!currentRule) throw new help.MyError('Não foi possível encontrar a regra para essa notificação', { currentRule, type: notification.notification_type });

		if (currentRule.is_active !== true) return { sendNow: false, currentRule, notActive: true };

		const moduloDate = new Date(turma[`modulo${currentRule.modulo}`]);	// the date of the module, uses the modulo linked to the rule to find the date saved on turma
		const dateToSend = await rules.getSendDate(turma, currentRule); // the date to actually send the notification
		if (!dateToSend) return { sendNow: false, currentRule, noTimeSet: true };

		// add date for the Reenvio of the notification
		if (notification.check_answered === true && currentRule.reminderDate) { dateToSend.setDate(dateToSend.getDate() + Math.abs(currentRule.reminderDate)); }

		let min;
		min = dateToSend;
		let max;
		// notification will be sent before the moduloDate, today needs to be between the notification date and the moduleDate
		if (dateToSend < moduloDate) {
			max = moduloDate;
		} else if ((details && details.sunday === true)) { // if it's sunday, the limit to send the notification is exactly one day after the modulo date
			max = new Date(turma[`modulo${currentRule.modulo}`]);
			max.setDate(max.getDate() + 1);
		} else {
			// notification will be sent after the moduloDate
			const nextModule = currentRule.modulo + 1; // get next module, today needs to be between the notification date and the moduleDate from the next module
			if (nextModule <= 3) {
				max = new Date(turma[`modulo${nextModule}`]);
			} else { // if there's no next module, add a few days to the day of the module
				moduloDate.setDate(moduloDate.getDate() + 15);
				max = moduloDate;
			}
		}

		if (min > max) {
			const change = min;
			min = max;
			max = change;
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
		const result = { min, max, today, sendNow: false, currentRule }; // eslint-disable-line object-curly-newline
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
		// indicados---
		// avaliação 360 pré - lembrete - check if pré was answered
		// if ([3, 19].includes(notification.notification_type) === true && notification.check_answered === true) {
		// 	const answerPre = recipient['respostas.pre'];
		// 	if (answerPre && Object.keys(answerPre).length > 0) return { send: false, msg: 'Indicado já respondeu avaliação 360 pré' };
		// }

		// // avaliação 360 pós - check if pré was answered
		// if ([9, 25].includes(notification.notification_type) === true) {
		// 	const answerPre = recipient['respostas.pre'];
		// 	if (!answerPre || Object.entries(answerPre).length === 0) return { send: false, msg: 'Indicado não respondeu nem a avaliação 360 pré' };

		// 	// avaliação 360 pós - lembrete - check if pós was answered
		// 	if (notification.check_answered === true) {
		// 		const answerPos = recipient['respostas.pos'];
		// 		if (answerPos && Object.entries(answerPos).length) return { send: false, msg: 'Indicado já respondeu pós' };
		// 	}
		// }

		// alunas---
		// check if aluna has anys indicados and if any of them didnt answer the avaliaçao
		// if ([4, 10, 20, 26].includes(notification.notification_type)) {
		// 	const column = [4, 20].includes(notification.notification_type) ? 'pre' : 'pos'; // select which questionario
		// 	const avaliadores = await indicadosAvaliadores.findAll({ where: { aluno_id: recipient.id }, raw: true }).then((r) => r)
		// .catch((err) => help.sentryError('Erro no findAll do indicadosAvaliadores', err));
		// 	if (!avaliadores || avaliadores.length === 0) return { send: false, msg: 'Aluna não tem nenhum indicado' };

		// 	const indicados = await DB.getIndicadoRespostasAnswerNull(recipient.id, column); // get indicados that didnt answer the questionario
		// 	if (!indicados || indicados.length === 0) return { send: false, msg: 'Todos os indicados da aluna já responderam' };
		// }

		// check if aluna is missing any questionario
		// if ([16, 32].includes(notification.notification_type)) {
		// 	const currentModule = await aux.findCurrentModulo(turma, today);
		// 	const atividadesMissing = await aux.findAtividadesMissing(currentModule, recipient.id);
		// 	if (!atividadesMissing || atividadesMissing.length === 0) return { send: false, msg: `Aluna já respondeu todos os questionários do módulo ${currentModule}` };
		// 	// store all the questionarios the aluna didnt answer
		// 	recipient.atividadesMissing = atividadesMissing;
		// }

		if (notification.additional_details && notification.additional_details.familiar === true) {
			const contatoMail = recipient.contato_emergencia_email;
			if (!contatoMail || typeof contatoMail !== 'string') return { send: false, msg: 'E-mail do contato não é válido', recipient };
			recipient.email = recipient.contato_emergencia_email;
		}

		return { send: true };
	} catch (error) {
		help.sentryError('Erro em checkShouldSendRecipient', { error, recipient, notification, turma, today }); // eslint-disable-line object-curly-newline
		return { send: false, error };
	}
}

async function actuallySendMessages(currentType, notification, recipient, logOnly) {
	const res = {};
	try {
		const newText = await aux.buildNewText(currentType, recipient); res.newText = newText;
		console.log('newText', newText);
		if (!newText || (!newText.email_text && !newText.chatbot_text)) throw new help.MyError('Não foi possível montar os textos');
		const attach = await aux.buildAttachment(currentType); res.attach = attach;
		if (!attach || (!attach.mail && !attach.chatbot)) throw new help.MyError('Não foi possível montar os attachments');

		if (logOnly) {
			const data = { };
			data.aluna_seria_enviada = true;
			data.aluna_tem_email = !!recipient.email;
			data.aluna_tem_chatbot = !!recipient['chatbot.fb_id'];
			data.attach = attach ? attach.length : 'Sem attachments';
			data.text = newText;
			return data;
		}

		const error = {};

		const mailAnswer = await aux.sendMail(recipient, attach, newText); res.mailAnswer = mailAnswer;
		console.log('mailAnswer', mailAnswer);
		if (mailAnswer.sent === true) await notificationQueue.update({ sent_at: new Date() }, { where: { id: notification.id } }).catch((err) => help.sentryError('Erro no update do sendAt', err));
		if (mailAnswer.sent === false) { error.mail = mailAnswer; error.mail.moment = new Date(); }

		const chatbotAnswer = await aux.sendChatbot(recipient, attach, newText); res.chatbotAnswer = chatbotAnswer;
		if (chatbotAnswer.sent === true) await notificationQueue.update({ sent_at_chatbot: new Date() }, { where: { id: notification.id } }).catch((err) => help.sentryError('Erro no update do sendAt', err));
		if (chatbotAnswer.sent === false) { error.chatbot = chatbotAnswer; error.chatbot.moment = new Date(); }

		if (error.mail || error.chatbot) await notificationQueue.update({ error }, { where: { id: notification.id } }).catch((err) => help.sentryError('Erro no update do notificationQueue', err));

		return { mailAnswer, chatbotAnswer };
	} catch (error) {
		help.sentryError('Erro em actuallySendMessages', { currentType, notification, recipient });
		return { error, currentType, notification, recipient }; // eslint-disable-line object-curly-newline
	}
}

async function sendNotificationFromQueue(queue, today, logOnly) {
	const res = {};
	try {
		const dontSend = ['3', '4', '9', '10', '19', '20', '25', '26'];

		if (!queue || queue.length === 0) return 'Não foram encontradas notificações na fila.';
		const nTypes = await notificationTypes.findAll({ where: {}, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro ao carregar notification_types', err));
		if (!nTypes || nTypes.length === 0) throw new help.MyError('Não foram carregados os tipos de notificação', { nTypes });

		const allTurmas = await turmas.findAll({ where: {}, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro ao carregar turma', err));
		if (!allTurmas || allTurmas.length === 0) throw new help.MyError('Não foram carregadas as turmas', { allTurmas });

		const nRules = await rules.buildNotificationRules();
		if (!nRules || !Object.keys(nRules) || Object.keys(nRules).length === 0) throw new help.MyError('Não foram carregadas as regras da planilha', { nRules });

		if (!today) today = await help.dateNoTimezone();

		for (let i = 0; i < queue.length; i++) {
			const notification = queue[i]; const cName = `nID_${notification.id}`;
			console.log('notification', notification);
			try {
				const currentTurma = await allTurmas.find((x) => x.id === notification.turma_id);
				if (!currentTurma) { throw new help.MyError('Não foi possível encontrar a turma da notificação', { notification, allTurmas, currentTurma }); }

				const currentType = await nTypes.find((x) => x.id === notification.notification_type);
				if (!currentType) throw new help.MyError('Não foi possível encontrar o tipo de notificação atual', { currentType, notification });

				if (dontSend.includes(currentType.id.toString())) {
					await notificationQueue.update({ error: { msg: 'Essa notificação não deve ser enviada' } }, { where: { id: notification.id } }).catch((err) => help.sentryError('Erro no update do model', err)); // eslint-disable-line object-curly-newline
					res[cName] = 'Essa notificação não deve ser enviada';
				} else {
					const currentRule = currentTurma.inCompany === true ? nRules.in_company : nRules.normal;
					if (!currentRule || currentRule.length === 0) throw new help.MyError('Não foram encontradas as regras para a turma');

					const shouldSend = await checkShouldSendNotification(notification, currentTurma, currentRule, today);

					if (!shouldSend || shouldSend.error) throw new help.MyError('Não foi possível descobrir se é hora de mandar a notificação', { shouldSend, notification, currentTurma, currentRule }); // eslint-disable-line object-curly-newline
					if (shouldSend.sendNow === true) {
						console.log('Deve enviar');
						const recipient = await aux.getRecipient(notification, currentTurma);
						console.log('recipient', recipient);
						if (!recipient || recipient.error) throw new help.MyError('Não foi possível carregar os dados do recipiente', { recipient, notification, currentTurma });

						const shouldRecipient = await checkShouldSendRecipient(recipient, notification, currentTurma, today);
						console.log('shouldRecipient', shouldRecipient);
						if (!shouldRecipient || shouldRecipient.error) throw new help.MyError('Não foi possível descobrir se recipiente pode receber', { shouldRecipient });

						if (shouldRecipient.send === true) {
							const sentRes = await actuallySendMessages(currentType, notification, recipient, logOnly);
							res[cName] = sentRes;
						} else {
							res[cName] = { msg: `Recipient não pode receber - ${shouldRecipient.msg}` }; // eslint-disable-line object-curly-newline
							await notificationQueue.update({ error: { msg: 'Recipient não pode receber', shouldRecipient } }, { where: { id: notification.id } }).catch((err) => help.sentryError('Erro no update do model', err)); // eslint-disable-line object-curly-newline
						}
					} else { // cant send this notification now
						console.log('Não vai enviar');
						res[cName] = { dataMin: shouldSend.min, dataMax: shouldSend.max, today: shouldSend.today, msg: shouldSend.msg || 'Não é hora de mandar essa notificação' }; // eslint-disable-line object-curly-newline
						if (!logOnly && today > shouldSend.max) await notificationQueue.update({ error: { msg: 'Já passou da hora de enviar essa notificação', shouldSend } }, { where: { id: notification.id } }).catch((err) => help.sentryError('Erro no update do model', err)); // eslint-disable-line object-curly-newline
					}
				}
			} catch (error) {
				// console.log('error', error);
				res[cName] = { error };
			}
			res[cName].details = notification;
		}
	} catch (error) {
		help.sentryError('Erro no sendNotificationFromQueue', error);
		return error;
	}

	return res;
}

async function getQueue(turmaID, alunoID, notificationType) {
	const query = {
		// sent_at: null, sent_at_chatbot: null, turma_id: { [Op.not]: null },
		sent_at: null,
		sent_at_chatbot: null,
		error: null,
		turma_id: { [Op.not]: null },
	};

	if (notificationType) query.notification_type = notificationType;
	if (turmaID) query.turma_id = turmaID;
	if (alunoID) query.aluno_id = alunoID;

	const queue = await notificationQueue.findAll({ where: query, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro ao carregar notification_queue', err));
	return queue || [];
}

module.exports = {
	checkShouldSendRecipient,
	checkShouldSendNotification,
	actuallySendMessages,
	sendNotificationFromQueue,
	getQueue,
};
