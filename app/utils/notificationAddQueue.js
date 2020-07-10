const notificationQueue = require('../server/models').notification_queue;
const indicadosAvaliadores = require('../server/models').indicacao_avaliadores;
const { alunos } = require('../server/models');
const { turma } = require('../server/models');
const { sentryError } = require('./helper');
const rules = require('./notificationRules');
const { getTurmaInCompany } = require('./DB_helper');
const { upsertFamiliarQueue } = require('./DB_helper');

async function getAdditionalDetails(rule) {
	if ([14, 15, 16, 30, 31, 32].includes(rule.notification_type)) {
		const details = {};
		if (rule.modulo) details.modulo = rule.modulo;
		if (typeof rule.sunday === 'boolean') details.sunday = rule.sunday;

		return details;
	}

	return null;
}

async function addQueueForFamiliar(alunaID, notificationRules) {
	const familiarRule = notificationRules.find((x) => x.familiar === true);
	const aluna = await alunos.findOne({ where: { id: alunaID }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findOne do alunos', err));
	if (!aluna || !aluna.id) return `Aluna com id ${alunaID} não encontrada!`;
	return upsertFamiliarQueue(familiarRule.notification_type, aluna.id, aluna.turma_id);
}

async function addNewNotificationAlunas(alunaId, turmaID) {
	try {
		const notificationRules = await rules.loadTabNotificationRules(await getTurmaInCompany(turmaID));
		const ourTurma = await turma.findOne({ where: { id: turmaID }, raw: true }).then((res) => res).catch((err) => sentryError('Erro em turmaFindOne', err));
		const rulesAlunos = await notificationRules.filter((x) => x.indicado !== true);
		if (ourTurma) {
			for (let i = 0; i < rulesAlunos.length; i++) { // for each kind of nofitification
				const rule = rulesAlunos[i];
				if (rule.familiar) {
					await addQueueForFamiliar(alunaId, notificationRules);
				} else {
					await notificationQueue.create({
						notification_type: rule.notification_type, aluno_id: alunaId, turma_id: turmaID, additional_details: await getAdditionalDetails(rule),
					}).then((res) => res).catch((err) => sentryError('Erro em notificationQueue.create', err));
				}
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
			notification_type: rule.notification_type,
			aluno_id: indicado.aluno_id,
			indicado_id: indicado.id,
			check_answered: false,
			turma_id: turmaID,
			additional_details: await getAdditionalDetails(rule),
		}).then((res) => res).catch((err) => sentryError('Erro em notificationQueue.create', err));

		if (rule.reminderDate) {
			// e-mails for non-familiars may be sent twice if the indicado didn't answer the form.
			// rule.reminderDate has the added days in which to send the new notification.

			// check_answered = true, in this kind of notification we have to check if the indicado hasn't answered the form already
			await notificationQueue.create({
				notification_type: rule.notification_type,
				aluno_id: indicado.aluno_id,
				indicado_id: indicado.id,
				check_answered: true,
				turma_id: turmaID,
				additional_details: await getAdditionalDetails(rule),
			}).then((res) => res).catch((err) => sentryError('Erro em notificationQueue.create for reminderDate', err));
		}
	}
}

async function addNewNotificationIndicados(alunaId, turmaID, check) {
	const notificationRules = await rules.loadTabNotificationRules(await getTurmaInCompany(turmaID));
	const indicados = await indicadosAvaliadores.findAll({ where: { aluno_id: alunaId }, raw: true }) // get every indicado from aluna
		.then((res) => res).catch((err) => sentryError('Erro em indicadosAvaliadores.findAll', err));
	const rulesIndicados = await notificationRules.filter((x) => x.indicado === true);
	const allNotifications = await notificationQueue.findAll({ where: { aluno_id: alunaId, sent_at: null, error: null }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do notificationQueue', err));

	if (indicados && indicados.length > 0) {
		const ourTurma = await turma.findOne({ where: { id: turmaID }, raw: true }).then((res) => res).catch((err) => sentryError('Erro em turmaFindOne', err));
		if (ourTurma) {
			for (let i = 0; i < rulesIndicados.length; i++) { // for each kind of nofitification
				const rule = rulesIndicados[i];

				for (let j = 0; j < indicados.length; j++) {
					const indicado = indicados[j];
					if (check) {
						const indicadoNotifications = await allNotifications.filter((x) => x.indicado_id === indicado.id);
						if (!indicadoNotifications || indicadoNotifications.length === 0) {
							await addAvaliadorOnQueue(rule, indicado, ourTurma.id);
						} else {
							console.log(`Indicado ${indicado.nome} - ${indicado.id} já tem ${indicadoNotifications.length} notificações`);
						}
					} else {
						await addAvaliadorOnQueue(rule, indicado, ourTurma.id);
					}
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
	const notificacoesTurma = await notificationQueue.findAll({ where: { turma_id: turmaID, notification_type: type, sent_at: null, error: null }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do notificationQueue', err)); // eslint-disable-line object-curly-newline
	const rulesAlunos = await notificationRules.filter((x) => x.indicado !== true && x.notification_type === type);
	if (!rulesAlunos || rulesAlunos.length === 0) {
		return `Regra ${type} não encontrada`;
	}
	const alunosTurma = await alunos.findAll({ where: { turma_id: turmaID }, raw: true }).then((r) => r).catch((err) => sentryError('Erro em turmaFindOne', err));

	for (let i = 0; i < alunosTurma.length; i++) {
		const aluno = alunosTurma[i];
		const notificacoes = notificacoesTurma.filter((x) => x.aluno_id === aluno.id);

		if (!notificacoes || notificacoes.length === 0) {
			res.push(`${aluno.nome_completo} receberá ${rulesAlunos.length} da notificação ${type}`);
			for (let j = 0; j < rulesAlunos.length; j++) {
				const rule = rulesAlunos[j];
				await notificationQueue.create({
					notification_type: rule.notification_type, aluno_id: aluno.id, turma_id: turmaID, modulo: rule.modulo, additional_details: await getAdditionalDetails(rule),
				}).then((r) => r).catch((err) => sentryError('Erro em notificationQueue.create', err));
			}
		} else {
			res.push(`${aluno.nome_completo} já tem ${notificacoes.length} da notificação ${type}`);
		}
	}

	console.log('res', res);
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

async function seeNotifications(turmaID) {
	const alunosTurma = await alunos.findAll({ where: { turma_id: turmaID }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do alunos', err));
	const notificationsTurma = await notificationQueue.findAll({ where: { turma_id: turmaID }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do notificationQueue', err));

	for (let i = 0; i < alunosTurma.length; i++) {
		const aluno = alunosTurma[i];

		const noti = await notificationsTurma.filter((x) => x.aluno_id === aluno.id);
		console.log(`\n\n${aluno.nome_completo}: ${aluno.id} - ${aluno.cpf}`);
		if (!noti || noti.length === 0) {
			console.log('Aluna não tem nenhuma notificação');
		} else {
			console.log(`Aluna tem ${noti.length} notificações!`);
			const ids = noti.map((x) => x.notification_type);
			console.log(ids.join(', '));
		}
	}
}

async function helpAddQueue(alunoID, turmaID) {
	const notificacoes = await notificationQueue.findAll({ where: { aluno_id: alunoID, sent_at: null, error: null }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do notificationQueue', err));
	if (!notificacoes || notificacoes.length === 0) {
		await addNewNotificationAlunas(alunoID, turmaID);
	}
}

async function addQueueProvisorio(turmaID, type, details) {
	const alunosTurma = await alunos.findAll({ where: { turma_id: turmaID }, attributes: ['id'], raw: true }).then((r) => r.map((x) => x.id)).catch((err) => console.log(err));
	const res = {};
	res.alunosTotal = alunosTurma.length;
	for (let i = 0; i < alunosTurma.length; i++) {
		const aID = alunosTurma[i];
		const aux = await notificationQueue.create({
			notification_type: type, aluno_id: aID, turma_id: turmaID, additional_details: details,
		}).then((r) => r).catch((err) => sentryError('Erro em notificationQueue.create', err));

		if (aux) {
			res[aID] = 'ok';
		} else {
			res[aID] = 'erro';
		}
	}

	return res;
}

module.exports = {
	addNewNotificationAlunas,
	addNewNotificationIndicados,
	addAvaliadorOnQueue,
	addMissingAlunoNotification,
	seeDataQueue,
	seeNotifications,
	helpAddQueue,
	addQueueProvisorio,
	addQueueForFamiliar,
};

// addNewNotificationAlunas(120, 15);
// addNewNotificationIndicados(120, 15);
