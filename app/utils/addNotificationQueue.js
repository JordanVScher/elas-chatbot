const notificationQueue = require('../server/models').notification_queue;
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
];

async function getSendDate(spreadsheet, turma, rule) {
	const desiredDatahora = `datahora${rule.modulo}`;
	const modulex = await spreadsheet.find(x => x.turma === turma && x[desiredDatahora]); // get turma that have this datahora (ex: módulo1)
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

async function addNewNotification(alunaId, alunaTurma) {
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

module.exports = {
	addNewNotification,
};
