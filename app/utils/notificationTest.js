const { Op } = require('sequelize');
const { sentryError } = require('./helper');
const sendQueue = require('./notificationSendQueue');
const { buildParametersRules } = require('./notificationRules');
const { getModuloDates } = require('./DB_helper');
const { getAluno } = require('./DB_helper');

const notificationTypes = require('../server/models').notification_types;
const notificationQueue = require('../server/models').notification_queue;

const time = 30 * 1000;

/**
 * Envia as notificações por e-mail e chatbot desconsiderando as datas
 * @param {number} cpf o cpf da aluna que irá receber (vazio = todos recebem)
 * @param {number} typeNumber o tipo de notificação (obs: em notificações como a 15 e 16 o texto ficará sempre igual)
 */
async function sendTestNotification(cpf, typeNumber, indicado = false) {
	console.log('Running sendTestNotification');
	const where = {};
	if (cpf) {
		const aluna = await getAluno(cpf);
		where.aluno_id = aluna.id;
	}

	if (typeNumber) { where.notification_type = typeNumber; }
	if (indicado) { where.indicado_id = { [Op.ne]: null }; }

	const parametersRules = await buildParametersRules();
	const moduleDates = await getModuloDates();

	const queue = await notificationQueue.findAll({ where, order: [['notification_type', 'ASC']], raw: true })
		.then((res) => res).catch((err) => sentryError('Erro ao carregar notification_queue TEST', err));

	const types = await notificationTypes.findAll({ where: {}, raw: true })
		.then((res) => res).catch((err) => sentryError('Erro ao carregar notification_types TEST', err));

	for (let i = 0; i < queue.length; i++) {
		const notification = queue[i];

		const recipient = await sendQueue.getRecipient(notification, moduleDates);

		setTimeout(async () => { // pass true to actuallySendMessages to not save anything on the database
			await sendQueue.actuallySendMessages(parametersRules, types, notification, recipient, true);
		}, time * (i));
	}
}

module.exports = {
	sendTestNotification,
};
