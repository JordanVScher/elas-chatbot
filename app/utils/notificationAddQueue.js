const notificationQueue = require('../server/models').notification_queue;
const indicadosAvaliadores = require('../server/models').indicacao_avaliadores;
const { turma } = require('../server/models');
const { sentryError } = require('./helper');
const rules = require('./notificationRules');

async function addNewNotificationAlunas(alunaId, turmaID) {
	try {
		const ourTurma = await turma.findOne({ where: { id: turmaID }, raw: true }).then(res => res).catch(err => sentryError('Erro em turmaFindOne', err));
		const rulesAlunos = await rules.notificationRules.filter(x => x.indicado !== true);
		if (ourTurma) {
			for (let i = 0; i < rulesAlunos.length; i++) { // for each kind of nofitification
				const rule = rulesAlunos[i];
				await notificationQueue.create({
					notification_type: rule.notification_type, aluno_id: alunaId, turma_id: turmaID, modulo: rule.modulo,
				}).then(res => res).catch(err => sentryError('Erro em notificationQueue.create', err));
			}
		} else {
			sentryError(`addNewNotificationAlunas: turma ${turmaID} not found`);
		}
	} catch (error) {
		sentryError('Erro em addNewNotificationAlunas ', error);
	}
}

async function addAvaliadorOnQueue(rule, indicado, turmaID) {
	// indicado can only receive a notification where rule familiar = true if indicado is also familiar = true
	if (!rule.familiar || (rule.familiar === true && indicado.familiar === true)) {
		await notificationQueue.create({
			notification_type: rule.notification_type, aluno_id: indicado.aluno_id, indicado_id: indicado.id, check_answered: false, turma_id: turmaID, modulo: rule.modulo,
		}).then(res => res).catch(err => sentryError('Erro em notificationQueue.create', err));

		if (rule.reminderDate) {
			// e-mails for non-familiars may be sent twice if the indicado didn't answer the form.
			// rule.reminderDate has the added days in which to send the new notification.

			// check_answered = true, in this kind of notification we have to check if the indicado hasn't answered the form already
			await notificationQueue.create({
				notification_type: rule.notification_type, aluno_id: indicado.aluno_id, indicado_id: indicado.id, check_answered: true, turma_id: turmaID,
			}).then(res => res).catch(err => sentryError('Erro em notificationQueue.create for reminderDate', err));
		}
	}
}

async function addNewNotificationIndicados(alunaId, turmaID) {
	const indicados = await indicadosAvaliadores.findAll({ where: { aluno_id: alunaId }, raw: true }) // // get every indicado from aluna
		.then(res => res).catch(err => sentryError('Erro em indicadosAvaliadores.findAll', err));
	const rulesIndicados = await rules.notificationRules.filter(x => x.indicado === true);

	if (indicados && indicados.length > 0) {
		const ourTurma = await turma.findOne({ where: { id: turmaID }, raw: true }).then(res => res).catch(err => sentryError('Erro em turmaFindOne', err));
		if (ourTurma) {
			for (let i = 0; i < rulesIndicados.length; i++) { // for each kind of nofitification
				const rule = rulesIndicados[i];

				for (let j = 0; j < indicados.length; j++) {
					const indicado = indicados[j];

					await addAvaliadorOnQueue(rule, indicado, ourTurma.id);
				}
			}
		} else {
			sentryError(`addNewNotificationIndicados: turma ${turmaID} not found`);
		}
	} else {
		sentryError(`addNewNotificationIndicados: aluna ${alunaId} não tem indicados`);
	}
}

module.exports = {
	addNewNotificationAlunas, addNewNotificationIndicados, addAvaliadorOnQueue,
};


// addNewNotificationAlunas(120, 15);
// addNewNotificationIndicados(120, 15);
