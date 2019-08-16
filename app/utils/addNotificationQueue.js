const notificationQueue = require('../server/models').notification_queue;
const indicadosAvaliadores = require('../server/models').indicacao_avaliadores;
const { turma } = require('../server/models');
const { sentryError } = require('./helper');

const notificationRulesAluna = [
	{ notification_type: 1, modulo: 1, timeChange: [{ qtd: -19, type: 'days' }]	},
	{ notification_type: 2, modulo: 1, timeChange: [{ qtd: -19, type: 'days' }, { qtd: 5, type: 'minutes' }] },
	{ notification_type: 4, modulo: 1, timeChange: [{ qtd: -10, type: 'days' }]	},
	{ notification_type: 5, modulo: 1, timeChange: [{ qtd: 5, type: 'days' }]	},
	{	notification_type: 6, modulo: 2, timeChange: [{ qtd: -12, type: 'days' }]	},
	{	notification_type: 7, modulo: 2, timeChange: [{ qtd: 5, type: 'days' }]	},
	{ notification_type: 8, modulo: 2, timeChange: [{ qtd: 5, type: 'days' }]	},
	{ notification_type: 9, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }]	},
	{ notification_type: 11, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }] },
	{	notification_type: 13, modulo: 3, timeChange: [{ qtd: -1, type: 'days' }] },
	{ notification_type: 14, modulo: 3, timeChange: [{ qtd: 5, type: 'days' }] },
	// Receive notification 24h before every class
	{ notification_type: 15, modulo: 1, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -24, type: 'hours' }] },
	{ notification_type: 15, modulo: 2, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -24, type: 'hours' }] },
	{ notification_type: 15, modulo: 3, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -24, type: 'hours' }] },
	// Receive notification 1h before every class, on saturday (-1h) and sunday (saturday + 23h)
	{ notification_type: 16, modulo: 1, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -1, type: 'hours' }] },
	{ notification_type: 16, modulo: 2, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -1, type: 'hours' }] },
	{ notification_type: 16, modulo: 3, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -1, type: 'hours' }] },
	{ notification_type: 16, modulo: 1, timeChange: [{ qtd: 0, type: 'days' }, { qtd: 23, type: 'hours' }] },
	{ notification_type: 16, modulo: 2, timeChange: [{ qtd: 0, type: 'days' }, { qtd: 23, type: 'hours' }] },
	{ notification_type: 16, modulo: 3, timeChange: [{ qtd: 0, type: 'days' }, { qtd: 23, type: 'hours' }] },
];

const notificationRulesIndicado = [
	{ notification_type: 3, modulo: 1, timeChange: [{ qtd: -10, type: 'days' }], reminderDate: 6 }, // eslint-disable-line object-curly-newline
	{ notification_type: 10, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }], reminderDate: 3 }, // eslint-disable-line object-curly-newline
	{ notification_type: 12, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }], familiar: true }, // eslint-disable-line object-curly-newline
];

async function getSendDate(ourTurma, rule, i) {
	if (process.env.NODE_ENV === 'prod') {
		const desiredDatahora = `modulo${rule.modulo}`;
		if (ourTurma) {
			const dataResult = new Date(ourTurma[desiredDatahora]);

			rule.timeChange.forEach((element) => {
				// Negative qtd means amount of time before the date. Positive means after.
				if (element.type === 'days') {
					dataResult.setDate(dataResult.getDate() + element.qtd);
				} else if (element.type === 'hours') {
					dataResult.setHours(dataResult.getHours() + element.qtd);
				} else if (element.type === 'minutes') {
					dataResult.setMinutes(dataResult.getMinutes() + element.qtd);
				}
			});

			return dataResult;
		}
		return false;
	}


	const today = new Date();
	const toAdd = (i + 1) * 3;
	today.setMinutes(today.getMinutes() + toAdd);
	return today;
}


async function addNewNotificationAlunas(alunaId, turmaID) {
	try {
		const ourTurma = await turma.findOne({ where: { id: turmaID }, raw: true }).then(res => res).catch(err => sentryError('Erro em turmaFindOne', err));

		if (ourTurma) {
			for (let i = 0; i < notificationRulesAluna.length; i++) {
				const rule = notificationRulesAluna[i];
				const sendDate = await getSendDate(ourTurma, rule, i);
				await notificationQueue.create({ notification_type: rule.notification_type, aluno_id: alunaId, when_to_send: sendDate })
					.then(res => res).catch(err => sentryError('Erro em notificationQueue.create', err));
			}
		} else {
			sentryError('Situação em addNewNotificationAlunas ', new Error(`turma ${turmaID} not found`));
		}
	} catch (error) {
		sentryError('Erro em addNewNotificationAlunas ', error);
	}
}

async function addNewNotificationIndicados(alunaId, turmaID) {
	const indicados = await indicadosAvaliadores.findAll({ // get every indicado from aluna
		where: { aluno_id: alunaId }, raw: true,
	}).then(res => res).catch(err => sentryError('Erro em indicadosAvaliadores.findAll', err));

	if (indicados && indicados.length > 0) {
		const ourTurma = await turma.findOne({ where: { id: turmaID }, raw: true }).then(res => res).catch(err => sentryError('Erro em turmaFindOne', err));
		for (let i = 0; i < notificationRulesIndicado.length; i++) {
			const rule = notificationRulesIndicado[i];
			const sendDate = await getSendDate(ourTurma, rule, i);

			for (let j = 0; j < indicados.length; j++) {
				const indicado = indicados[j];

				// indicado can only receive a notification where familiar true if indicado is also familiar = true
				if (!rule.familiar || (rule.familiar === true && indicado.familiar === true)) {
					await notificationQueue.create({ notification_type: rule.notification_type, indicado_id: indicado.id, when_to_send: sendDate }).then(res => res)
						.catch(err => sentryError('Erro em notificationQueue.create', err));

					if (rule.reminderDate) {
						// e-mails for non-familiars may be sent twice if the indicado didn't answer the form.
						// rule.reminderDate has the added days in which to send the new notification.
						await sendDate.setDate(await sendDate.getDate() + rule.reminderDate);

						await notificationQueue.create({
							notification_type: rule.notification_type, indicado_id: indicado.id, when_to_send: sendDate, check_answered: true,
						}).then(res => res).catch(err => sentryError('Erro em notificationQueue.create for reminderDate', err));
					}
				}
			}
		}
	} else {
		sentryError(`Erro em addNewNotificationIndicados -> aluna ${alunaId} não tem indicados`, new Error('Couldnt find aluna indicados'));
	}
}

module.exports = {
	addNewNotificationAlunas, addNewNotificationIndicados,
};


// addNewNotificationAlunas(120, 15);
// addNewNotificationIndicados(265, 15);
