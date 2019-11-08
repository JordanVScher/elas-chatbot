require('dotenv').config();

const { readFileSync } = require('fs');
const help = require('./helper');
const sendQueue = require('./notificationSendQueue');
const mailer = require('./mailer');
const broadcast = require('./broadcast');
const { getModuloDates } = require('./DB_helper');

const notificationTypes = require('../server/models').notification_types;
const notificationQueue = require('../server/models').notification_queue;
const indicadosAvaliadores = require('../server/models').indicacao_avaliadores;
const { getTurmaName } = require('./DB_helper');

const time = 30 * 1000;

async function sendTestNotification(alunaID) {
	let queue = await notificationQueue.findAll({
		where: { aluno_id: alunaID },
		distinct: 'notification_type',
		order: [['notification_type', 'ASC']],
		raw: true,
	}).then((res) => res).catch((err) => help.sentryError('Erro em notificationQueue.findAll', err));

	queue = Array.from(new Set(queue.map((a) => a.notification_type)))
		.map((notificatioType) => queue.find((a) => a.notification_type === notificatioType));

	const indicados = await indicadosAvaliadores.findAll({
		where: { aluno_id: alunaID },
		order: [['id', 'DESC']],
		raw: true,
	}).then((res) => res).catch((err) => help.sentryError('Erro em notificationQueue.findAll', err));

	for (let i = 0; i < indicados.length; i++) {
		const element = indicados[i];
		const indiciadoNotification = await notificationQueue.findAll({
			where: { indicado_id: element.id },
			raw: true,
		}).then((res) => res).catch((err) => help.sentryError('Erro em notificationQueue.findAll2', err));
		if (indiciadoNotification && indiciadoNotification.length > 0) {
			indiciadoNotification.forEach((element3) => {
				queue.push(element3);
			});
		}
	}

	if (queue && queue.length > 0) {
		const moduleDates = await getModuloDates();
		const aluna = await sendQueue.getAluna(alunaID, moduleDates);
		const types = await notificationTypes.findAll({ where: {}, raw: true })
			.then((res) => res).catch((err) => help.sentryError('Erro ao carregar notification_types', err));

		const turmaName = await getTurmaName(aluna.turma_id);

		for (let i = 0; i < queue.length; i++) {
			const notification = queue[i];

			let recipient;
			if (notification.aluno_id) {
				recipient = aluna;
			} else if (notification.indicado_id) {
				recipient = await sendQueue.getIndicado(notification.indicado_id, moduleDates);
			}

			recipient.turmaName = turmaName;
			if (await sendQueue.checkShouldSendRecipient(recipient, notification) === true) {
				const currentType = types.find((x) => x.id === notification.notification_type); // get the correct kind of notification
				const map = sendQueue.parametersRules[currentType.id]; // get the respective map
				const newText = await sendQueue.replaceParameters(currentType, await sendQueue.fillMasks(map, recipient), recipient);
				const attachment = await sendQueue.buildAttachment(currentType, recipient.cpf);
				const error = {};

				setTimeout(async () => {
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

					if (error.objectKeys > 0) {
						await help.sentryError(`Erro na ${newText.email_subject} do aluno ${recipient.email}`, error);
					}
				}, time * (i + 1));
			}
		}
		return { qtd: queue.length };
	}
	return { error: 'Você não tem notificações!' };
}


module.exports = {
	sendTestNotification,
};
