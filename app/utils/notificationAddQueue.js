const notificationQueue = require('../server/models').notification_queue;
const indicadosAvaliadores = require('../server/models').indicacao_avaliadores;
const { alunos } = require('../server/models');
const { turma } = require('../server/models');
const { sentryError } = require('./helper');
const rules = require('./notificationRules');
const { getTurmaInCompany } = require('./DB_helper');

async function addNewNotificationAlunas(alunaId, turmaID) {
	try {
		const notificationRules = await rules.loadTabNotificationRules(await getTurmaInCompany(turmaID));
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
	} catch (e) {
		sentryError('Erro em addNewNotificationAlunas ', e);
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

async function addNewNotificationIndicados(alunaId, turmaID) {
	const notificationRules = await rules.loadTabNotificationRules(await getTurmaInCompany(turmaID));
	const indicados = await indicadosAvaliadores.findAll({ where: { aluno_id: alunaId }, raw: true }) // get every indicado from aluna
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


async function addMissingAlunoNotification(turmaID, type) {
	const res = [];
	const notificationRules = await rules.loadTabNotificationRules(await getTurmaInCompany(turmaID));
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

async function seeDataQueue(turmaID) {
	const result = [];
	const alunosTurma = await alunos.findAll({ where: { turma_id: turmaID }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do alunos', err));
	const notificationsTurma = await notificationQueue.findAll({ where: { turma_id: turmaID }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do notificationQueue', err));
	const alunosIds = await alunosTurma.map((x) => x.id);

	const indicadosTurma = await indicadosAvaliadores.findAll({ where: { aluno_id: alunosIds }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do model', err));

	result.totalAlunas = alunosTurma.length;
	result.totalFila = notificationsTurma.length;
	result.totalIndicados = indicadosTurma.length;
	for (let i = 0; i < alunosTurma.length; i++) {
		const a = alunosTurma[i];
		const key = `aluna_${a.id}`;
		result[key] = a;
		const queueAluna = await notificationsTurma.filter((x) => x.aluno_id === a.id);
		if (!queueAluna || queueAluna.length === 0) {
			result[key].fila = 'Nenhuma notificação!';
		} else {
			result[key].fila = `${queueAluna.length} notificações!`;
			const enviadas = await queueAluna.filter((x) => x.sent_at !== null);
			result[key].enviadas = `Foram enviadas ${enviadas.length}!`;
			const erro = await queueAluna.filter((x) => x.error !== null);
			result[key].com_erro = `${erro.length}`;
		}

		const alunaIndicados = await indicadosTurma.filter((x) => x.aluno_id === a.id);
		for (let j = 0; j < alunaIndicados.length; j++) {
			const indicado = alunaIndicados[j];
			result[key].indicados = indicado;

			const queueIndicados = await notificationsTurma.filter((x) => x.indicado_id === indicado.id);
			if (!queueIndicados || queueIndicados.length === 0) {
				result[key].indicados.fila = 'Nenhuma notificação!';
			} else {
				result[key].indicados.fila = `${queueIndicados.length} notificações!`;
				const enviadas = await queueIndicados.filter((x) => x.sent_at !== null);
				result[key].indicados.enviadas = `Foram enviadas ${enviadas.length}!`;
				const erro = await queueIndicados.filter((x) => x.error !== null);
				result[key].indicados.com_erro = `${erro.length}`;
			}
		}
	}

	console.log('result', result);
	return result;
}

async function addMissingNotificationOnQueue(turmaID) {
	const alunosTurma = await alunos.findAll({ where: { turma_id: turmaID }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do alunos', err));
	const notificationsTurma = await notificationQueue.findAll({ where: { turma_id: turmaID }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do notificationQueue', err));

	for (let i = 0; i < alunosTurma.length; i++) {
		const aluno = alunosTurma[i];

		const noti = await notificationsTurma.filter((x) => x.aluno_id === aluno.id);
		console.log(`\n\nAluna ${aluno.nome_completo}: ${aluno.id} - ${aluno.cpf}`);
		if (!noti || noti.length === 0) {
			console.log('Aluna não tem nenhuma notificação');
		} else {
			console.log(`Aluna tem ${noti.length} notificações!`);
			const ids = noti.map((x) => x.notification_type);
			console.log(ids.join(', '));
		}
	}
}

module.exports = {
	addNewNotificationAlunas, addNewNotificationIndicados, addAvaliadorOnQueue, addMissingAlunoNotification, seeDataQueue, addMissingNotificationOnQueue,
};

// addNewNotificationAlunas(120, 15);
// addNewNotificationIndicados(120, 15);
