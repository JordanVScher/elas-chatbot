const notificationQueue = require('../server/models').notification_queue;
const indicadosAvaliadores = require('../server/models').indicacao_avaliadores;
const { alunos } = require('../server/models');
const { turma } = require('../server/models');
const { sentryError } = require('./helper');
const rules = require('./notificationRules');
const { getTurmaName } = require('./DB_helper');
const { getTurmaInCompany } = require('./DB_helper');

async function addNewNotificationAlunas(alunaId, turmaID, reRules, noRules) {
	try {
		const regularRules = reRules || await rules.loadTabNotificationRules(await getTurmaInCompany(turmaID));
		const notificationRules = noRules || await rules.getNotificationRules(await getTurmaName(turmaID), regularRules);
		const ourTurma = await turma.findOne({ where: { id: turmaID }, raw: true }).then((res) => res).catch((err) => sentryError('Erro em turmaFindOne', err));
		const rulesAlunos = await notificationRules.filter((x) => x.indicado !== true);
		if (ourTurma) {
			for (let i = 0; i < rulesAlunos.length; i++) { // for each kind of nofitification
				const rule = rulesAlunos[i];
				await notificationQueue.create({
					notification_type: rule.notification_type, aluno_id: alunaId, turma_id: turmaID, modulo: rule.modulo,
				}).then((res) => res).catch((err) => sentryError('Erro em notificationQueue.create', err));
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
		}).then((res) => res).catch((err) => sentryError('Erro em notificationQueue.create', err));

		if (rule.reminderDate) {
			// e-mails for non-familiars may be sent twice if the indicado didn't answer the form.
			// rule.reminderDate has the added days in which to send the new notification.

			// check_answered = true, in this kind of notification we have to check if the indicado hasn't answered the form already
			await notificationQueue.create({
				notification_type: rule.notification_type, aluno_id: indicado.aluno_id, indicado_id: indicado.id, check_answered: true, turma_id: turmaID,
			}).then((res) => res).catch((err) => sentryError('Erro em notificationQueue.create for reminderDate', err));
		}
	}
}

async function addNewNotificationIndicados(alunaId, turmaID, reRules, noRules) {
	const regularRules = reRules || await rules.loadTabNotificationRules(await getTurmaInCompany(turmaID));
	const notificationRules = noRules || await rules.getNotificationRules(await getTurmaName(turmaID), regularRules);
	const indicados = await indicadosAvaliadores.findAll({ where: { aluno_id: alunaId }, raw: true }) // // get every indicado from aluna
		.then((res) => res).catch((err) => sentryError('Erro em indicadosAvaliadores.findAll', err));
	const rulesIndicados = await notificationRules.filter((x) => x.indicado === true);

	if (indicados && indicados.length > 0) {
		const ourTurma = await turma.findOne({ where: { id: turmaID }, raw: true }).then((res) => res).catch((err) => sentryError('Erro em turmaFindOne', err));
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
		console.log(`Aluna ${alunaId} não tem indicados!`);
		// sentryError(`addNewNotificationIndicados: aluna ${alunaId} não tem indicados`); // eslint-disable-line
	}
}


async function addAlunasToQueue(turmaID) {
	const queueTurma = await notificationQueue.findAll({ where: { turma_id: turmaID, sent_at: null }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do notificationQueue', err));
	const alunosOnQueue = [];
	queueTurma.forEach((e) => {
		const id = e.aluno_id;
		if (!alunosOnQueue.includes(id)) alunosOnQueue.push(id);
	});

	const alunasTurma = await alunos.findAll({ where: { turma_id: turmaID }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do alunos', err));
	const alunosToAdd = [];
	alunasTurma.forEach((e) => {
		const { id } = e;
		if (!alunosOnQueue.includes(id)) alunosToAdd.push(id);
	});

	if (alunosToAdd && alunosToAdd.length > 0) {
		const regularRules = await rules.loadTabNotificationRules(await getTurmaInCompany(turmaID));
		const notificationRules = await rules.getNotificationRules(await getTurmaName(turmaID), regularRules);
		for (let i = 0; i < alunosToAdd.length; i++) {
			const e = alunosToAdd[i];
			addNewNotificationAlunas(e, turmaID, regularRules, notificationRules);
			addNewNotificationIndicados(e, turmaID, regularRules, notificationRules);
		}
		console.log('Done');
	} else {
		console.log(`No alunos left to add in queue for turma ${turmaID}`);
	}
}

async function addMissingAlunoNotification(turmaID, type) {
	const res = [];
	const regularRules = await rules.loadTabNotificationRules(await getTurmaInCompany(turmaID));
	const notificationRules = await rules.getNotificationRules(await getTurmaName(turmaID), regularRules);
	const rulesAlunos = await notificationRules.filter((x) => x.indicado !== true && x.notification_type === type);
	if (!rulesAlunos || rulesAlunos.length === 0) {
		return `Regra ${type} não encontrada`;
	}
	const alunosTurma = await alunos.findAll({ where: { turma_id: turmaID }, raw: true }).then((r) => r).catch((err) => sentryError('Erro em turmaFindOne', err));

	for (let i = 0; i < alunosTurma.length; i++) {
		const aluno = alunosTurma[i];
		const notificacoes = await notificationQueue.findAll({ where: { aluno_id: aluno.id, notification_type: type, sent_at: null, error: null }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do notificationQueue', err)); // eslint-disable-line object-curly-newline
		if (!notificacoes || notificacoes.length === 0) {
			res.push(`${aluno.nome_completo} receberá ${rulesAlunos.length} da notificação ${type}`);
			for (let j = 0; j < rulesAlunos.length; j++) {
				const rule = rulesAlunos[j];
				await notificationQueue.create({
					notification_type: rule.notification_type, aluno_id: aluno.id, turma_id: turmaID, modulo: rule.modulo,
				}).then((r) => r).catch((err) => sentryError('Erro em notificationQueue.create', err));
			}
		} else {
			res.push(`${aluno.nome_completo} já tem ${notificacoes.length} da notificação ${type}`);
		}
	}

	return res;
}
module.exports = {
	addNewNotificationAlunas, addNewNotificationIndicados, addAvaliadorOnQueue, addAlunasToQueue, addMissingAlunoNotification,
};

// addNewNotificationAlunas(120, 15);
// addNewNotificationIndicados(120, 15);
