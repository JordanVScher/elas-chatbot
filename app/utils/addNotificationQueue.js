const notificationQueue = require('../server/models').notification_queue;
const indicadosAvaliadores = require('../server/models').indicacao_avaliadores;
const help = require('./helper');

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
	{ notification_type: 15, modulo: 1, timeChange: [{ qtd: -24, type: 'hours' }] },
	{ notification_type: 15, modulo: 2, timeChange: [{ qtd: -24, type: 'hours' }] },
	{ notification_type: 15, modulo: 3, timeChange: [{ qtd: -24, type: 'hours' }] },
	// Receive notification 1h before every class, on saturday (-1h) and sunday (saturday + 23h)
	{ notification_type: 16, modulo: 1, timeChange: [{ qtd: -1, type: 'hours' }] },
	{ notification_type: 16, modulo: 2, timeChange: [{ qtd: -1, type: 'hours' }] },
	{ notification_type: 16, modulo: 3, timeChange: [{ qtd: -1, type: 'hours' }] },
	{ notification_type: 16, modulo: 1, timeChange: [{ qtd: 23, type: 'hours' }] },
	{ notification_type: 16, modulo: 2, timeChange: [{ qtd: 23, type: 'hours' }] },
	{ notification_type: 16, modulo: 3, timeChange: [{ qtd: 23, type: 'hours' }] },
];

const notificationRulesIndicado = [
	{ notification_type: 3, modulo: 1, timeChange: [{ qtd: -10, type: 'days' }] },
	{ notification_type: 10, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }] },
	{ notification_type: 12, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }], familiar: true }, // eslint-disable-line object-curly-newline
];

async function getSendDate(spreadsheet, turma, rule) {
	const desiredDatahora = `datahora${rule.modulo}`;
	const modulex = await spreadsheet.find(x => x.turma === turma && x[desiredDatahora]); // get turma that has this datahora (ex: datahora1)
	if (modulex) {
		const dataResult = new Date(modulex[desiredDatahora]);
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

async function addNewNotificationAlunas(alunaId, alunaTurma) {
	const spreadsheet = await help.getFormatedSpreadsheet();
	for (let i = 0; i < notificationRulesAluna.length; i++) {
		const rule = notificationRulesAluna[i];
		const sendDate = await getSendDate(spreadsheet, alunaTurma, rule);
		await notificationQueue.create({ notification_type: rule.notification_type, aluno_id: alunaId, when_to_send: sendDate }).then(res => res)
			.catch((err) => { // eslint-disable-line
				console.log('Erro em notificationQueue.create', JSON.stringify(err, null, 2)); help.Sentry.captureMessage('Erro em notificationQueue.create');
			});
	}
}

async function addNewNotificationIndicados(alunaId, alunaTurma) {
	const indicados = await indicadosAvaliadores.findAll({ // get every indicado from aluna
		where: { aluno_id: alunaId }, raw: true,
	}).then(res => res).catch((err) => {
		console.log('Erro em indicadosAvaliadores.findAll', JSON.stringify(err, null, 2)); help.Sentry.captureMessage('Erro em indicadosAvaliadores.findAll');
		return false;
	});

	if (indicados && indicados.length > 0) {
		const spreadsheet = await help.getFormatedSpreadsheet();
		for (let i = 0; i < notificationRulesIndicado.length; i++) {
			const rule = notificationRulesIndicado[i];
			const sendDate = await getSendDate(spreadsheet, alunaTurma, rule);

			indicados.forEach(async (indicado) => {
				// indicado can only receive a notification where familiar true if indicado is also familiar = true
				if (!rule.familiar || (rule.familiar === true && indicado.familiar === true)) {
					await notificationQueue.create({ notification_type: rule.notification_type, indicado_id: indicado.id, when_to_send: sendDate }).then(res => res)
            .catch((err) => { // eslint-disable-line
							console.log('Erro em notificationQueue.create', JSON.stringify(err, null, 2)); help.Sentry.captureMessage('Erro em notificationQueue.create');
						});
				}
			});
		}
	} else {
		console.log(`Erro em addNewNotificationIndicados -> aluna ${alunaId} não tem indicados`); help.Sentry.captureMessage('Erro em addNewNotificationIndicados');
	}
}

module.exports = {
	addNewNotificationAlunas, addNewNotificationIndicados,
};

// addNewNotificationAlunas(120, 'T7-SP');
