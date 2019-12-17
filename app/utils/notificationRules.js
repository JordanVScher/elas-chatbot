const { getTinyUrl } = require('./helper');
const { reloadSpreadSheet } = require('./helper');

// relation of keys from the spreadsheet and the model attributes
const turmaMap = {
	tipo: 'notification_type',
	modulo: 'modulo',
	dias: 'days',
	horas: 'hours',
	minutos: 'minutes',
	lembrete: 'reminderDate',
	indicado: 'indicado',
	familiar: 'familiar',
	domingo: 'sunday',
};

// adapt the spreadsheet keys to match the model
async function buildQuery(data, map) {
	const result = {};

	Object.keys(data).forEach(async (element) => {
		const queryInput = map[element];
		if (queryInput && queryInput.toString() && ((data[element] && data[element].toString()) || typeof data[element] === 'boolean')) {
			let aux = data[element].toString().trim();
			if (parseInt(aux, 10)) aux = parseInt(aux, 10);
			if (aux === 'true') aux = true;
			if (aux === 'false') aux = false;
			result[queryInput] = aux;
		}
	});

	if (result) {
		const timeChange = [];
		if (result.days) { timeChange.push({ qtd: result.days, type: 'days' }); delete result.days; }
		if (result.hours) { timeChange.push({ qtd: result.hours, type: 'hours' }); delete result.hours; }
		if (result.minutes) { timeChange.push({ qtd: result.minutes, type: 'minutes' }); delete result.minutes; }

		result.timeChange = timeChange;
	}
	return result || false;
}

// build the regular rule set, based on the spreadsheet
async function buildNotificationRules(isInCompany) {
	let aba = 1;
	if (isInCompany === true) { aba = 2; }
	const spreadsheet = await reloadSpreadSheet(aba);
	const rules = [];
	if (spreadsheet && spreadsheet.length > 0) {
		for (let i = 0; i < spreadsheet.length; i++) {
			const e = spreadsheet[i];
			const query = await buildQuery(e, turmaMap);
			if (query) rules.push(query);
		}
	}
	return rules;
}


async function getNotificationRules(turmaName, regularRules) {
	if (turmaName) turmaName = turmaName.toString().trim();
	if (turmaName === 'Teste') {
		return [
			{ notification_type: 1, modulo: 1, timeChange: [{ qtd: -2, type: 'days' }] },
			{ notification_type: 2, modulo: 1, timeChange: [{ qtd: -2, type: 'days' }] },
			{ notification_type: 3, modulo: 1, timeChange: [{ qtd: -1, type: 'days' }], indicado: true, reminderDate: 1 }, // eslint-disable-line object-curly-newline
			{ notification_type: 4, modulo: 1, timeChange: [{ qtd: -1, type: 'days' }] },
			{ notification_type: 5, modulo: 1, timeChange: [{ qtd: 1, type: 'days' }, { qtd: 20, type: 'hours' }] }, // 20 hours after the second day of class
			{ notification_type: 6, modulo: 2, timeChange: [{ qtd: -1, type: 'days' }] },
			{ notification_type: 7, modulo: 2, timeChange: [{ qtd: 1, type: 'days' }] }, // on the second class
			{ notification_type: 8, modulo: 2, timeChange: [{ qtd: 1, type: 'days' }, { qtd: 20, type: 'hours' }] }, // 20 hours after the second day of class
			{ notification_type: 9, modulo: 3, timeChange: [{ qtd: -2, type: 'days' }] },
			{ notification_type: 10, modulo: 3, timeChange: [{ qtd: -2, type: 'days' }], indicado: true, reminderDate: 1 }, // eslint-disable-line object-curly-newline
			{ notification_type: 11, modulo: 3, timeChange: [{ qtd: -2, type: 'days' }] },
			{ notification_type: 12, modulo: 3, timeChange: [{ qtd: -1, type: 'days' }], indicado: true, familiar: true }, // eslint-disable-line object-curly-newline
			{ notification_type: 13, modulo: 3, timeChange: [{ qtd: 1, type: 'days' }, { qtd: 20, type: 'hours' }] }, // 20 hours after the second day of class
			{ notification_type: 14, modulo: 3, timeChange: [{ qtd: 2, type: 'days' }] },
			// Receive notification 24h before every class
			{ notification_type: 15, modulo: 1, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -24, type: 'hours' }] },
			{ notification_type: 15, modulo: 2, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -24, type: 'hours' }] },
			{ notification_type: 15, modulo: 3, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -24, type: 'hours' }] },
			// Receive notification 1h before every class, on saturday (-1h) and sunday (saturday + 23h)
			{ notification_type: 16, modulo: 1, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -1, type: 'hours' }], sunday: false }, // eslint-disable-line object-curly-newline
			{ notification_type: 16, modulo: 2, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -1, type: 'hours' }], sunday: false }, // eslint-disable-line object-curly-newline
			{ notification_type: 16, modulo: 3, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -1, type: 'hours' }], sunday: false }, // eslint-disable-line object-curly-newline
			{ notification_type: 16, modulo: 1, timeChange: [{ qtd: 0, type: 'days' }, { qtd: 23, type: 'hours' }], sunday: true }, // eslint-disable-line object-curly-newline
			{ notification_type: 16, modulo: 2, timeChange: [{ qtd: 0, type: 'days' }, { qtd: 23, type: 'hours' }], sunday: true }, // eslint-disable-line object-curly-newline
			{ notification_type: 16, modulo: 3, timeChange: [{ qtd: 0, type: 'days' }, { qtd: 23, type: 'hours' }], sunday: true }, // eslint-disable-line object-curly-newline
		];
	}

	if (turmaName === 'Simulação-1') {
		return [
			{ notification_type: 1, modulo: 1, timeChange: [{ qtd: -4, type: 'days' }] },
			{ notification_type: 2, modulo: 1, timeChange: [{ qtd: -3, type: 'days' }] },
			{ notification_type: 3, modulo: 1, timeChange: [{ qtd: -2, type: 'days' }], indicado: true, reminderDate: 1 }, // eslint-disable-line object-curly-newline
			{ notification_type: 4, modulo: 1, timeChange: [{ qtd: -1, type: 'days' }] },
			{ notification_type: 5, modulo: 1, timeChange: [{ qtd: 2, type: 'days' }, { qtd: 20, type: 'hours' }] }, // 20 hours after the second day of class
			{ notification_type: 6, modulo: 2, timeChange: [{ qtd: -2, type: 'days' }] },
			{ notification_type: 7, modulo: 2, timeChange: [{ qtd: 2, type: 'days' }] }, // on the second class
			{ notification_type: 8, modulo: 2, timeChange: [{ qtd: 2, type: 'days' }, { qtd: 20, type: 'hours' }] }, // 20 hours after the second day of class
			{ notification_type: 9, modulo: 3, timeChange: [{ qtd: -4, type: 'days' }] },
			{ notification_type: 10, modulo: 3, timeChange: [{ qtd: -4, type: 'days' }], indicado: true, reminderDate: 1 }, // eslint-disable-line object-curly-newline
			{ notification_type: 11, modulo: 3, timeChange: [{ qtd: -3, type: 'days' }] },
			{ notification_type: 12, modulo: 3, timeChange: [{ qtd: -2, type: 'days' }], indicado: true, familiar: true }, // eslint-disable-line object-curly-newline
			{ notification_type: 13, modulo: 3, timeChange: [{ qtd: 2, type: 'days' }, { qtd: 20, type: 'hours' }] }, // 20 hours after the second day of class
			{ notification_type: 14, modulo: 3, timeChange: [{ qtd: 4, type: 'days' }] },
			// Receive notification 24h before every class
			{ notification_type: 15, modulo: 1, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -24, type: 'hours' }] },
			{ notification_type: 15, modulo: 2, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -24, type: 'hours' }] },
			{ notification_type: 15, modulo: 3, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -24, type: 'hours' }] },
			// Receive notification 1h before every class, on saturday (-1h) and sunday (saturday + 23h)
			{ notification_type: 16, modulo: 1, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -1, type: 'hours' }], sunday: false }, // eslint-disable-line object-curly-newline
			{ notification_type: 16, modulo: 2, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -1, type: 'hours' }], sunday: false }, // eslint-disable-line object-curly-newline
			{ notification_type: 16, modulo: 3, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -1, type: 'hours' }], sunday: false }, // eslint-disable-line object-curly-newline
			{ notification_type: 16, modulo: 1, timeChange: [{ qtd: 0, type: 'days' }, { qtd: 23, type: 'hours' }], sunday: true }, // eslint-disable-line object-curly-newline
			{ notification_type: 16, modulo: 2, timeChange: [{ qtd: 0, type: 'days' }, { qtd: 23, type: 'hours' }], sunday: true }, // eslint-disable-line object-curly-newline
			{ notification_type: 16, modulo: 3, timeChange: [{ qtd: 0, type: 'days' }, { qtd: 23, type: 'hours' }], sunday: true }, // eslint-disable-line object-curly-newline
		];
	}

	// if current turma isn't a special case, use the regular rules from the spreadsheet
	return regularRules;
}

// return the sum of the module date (from the turma) with the notification rule
async function getSendDate(ourTurma, currentRule) {
	const desiredDatahora = `modulo${currentRule.modulo}`;

	if (ourTurma) {
		const dataResult = new Date(ourTurma[desiredDatahora]);
		currentRule.timeChange.forEach((element) => {
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

async function buildParametersRules() {
	return {
		1: {
			GRUPOWHATS: await getTinyUrl(process.env.GRUPOWHATSAP),
			LINKDONNA: await getTinyUrl(process.env.LINK_DONNA),
			MODULO1: '',
			LOCAL: '',
			FDSMOD1: '',
			FDSMOD2: '',
			FDSMOD3: '',
		},
		2: {
			SONDAGEMPRE: process.env.SONDAGEM_PRE_LINK,
			INDICACAO360: process.env.INDICACAO360_LINK,
			DISC_LINK: await getTinyUrl(process.env.DISC_LINK1),
			LINKDONNA: await getTinyUrl(process.env.LINK_DONNA),
			TURMA: '',
			MOD1_15DIAS: '',
			MOD1_2DIAS: '',
		},
		3: { AVALIADORPRE: process.env.AVALIADOR360PRE_LINK, MOD1_2DIAS: '' },
		4: { AVALIADORPRE: process.env.AVALIADOR360PRE_LINK, MOD1_2DIAS: '' },
		5: { AVALIACAO1: process.env.MODULO1_LINK },
		6: { LINKDONNA: await getTinyUrl(process.env.LINK_DONNA) },
		7: {
			EMAILMENTORIA: process.env.EMAILMENTORIA,
			MOD3_LASTDAY: '',
			MOD3_2DIAS: '',
		},
		8: { AVALIACAO2: process.env.MODULO2_LINK },
		9: {
			SONDAGEMPOS: process.env.SONDAGEM_POS_LINK,
			DISC_LINK: await getTinyUrl(process.env.DISC_LINK2),
			TURMA: '',
			MOD3_7DIAS: '',
		},
		10: {
			AVALIADORPOS: process.env.AVALIADOR360POS_LINK,
			MOD3_7DIAS: '',
		},
		11: {
			MOD3_7DIAS: '',
			AVALIADORPOS: process.env.AVALIADOR360POS_LINK,
			MOD3_LASTDAY: '',
		},
		12: {
			NUMBERWHATSAP: process.env.NUMBERWHATSAP,
			MOD3_LASTDAY: '',
		},
		13: { AVALIACAO3: process.env.MODULO3_LINK },
		14: { AVALIACAO3: process.env.MODULO3_LINK },
		15: {
			MODULOAVISAR: '', LOCAL: '', DATAHORA: '', ATIVIDADESCOMPLETAS: '',
		},
		16: {},
		17: {
			GRUPOWHATS: await getTinyUrl(process.env.GRUPOWHATSAP),
			LINKDONNA: await getTinyUrl(process.env.LINK_DONNA),
			MODULO1: '',
			LOCAL: '',
			FDSMOD1: '',
			FDSMOD2: '',
			FDSMOD3: '',
		},
		18: {
			SONDAGEMPRE: process.env.SONDAGEM_PRE_LINK,
			INDICACAO360: process.env.INDICACAO360_LINK,
			DISC_LINK: await getTinyUrl(process.env.DISC_LINK1),
			LINKDONNA: await getTinyUrl(process.env.LINK_DONNA),
			TURMA: '',
			MOD1_15DIAS: '',
			MOD1_2DIAS: '',
		},
		19: { AVALIADORPRE: process.env.AVALIADOR360PRE_LINK, MOD1_2DIAS: '' },
		20: { AVALIADORPRE: process.env.AVALIADOR360PRE_LINK, MOD1_2DIAS: '' },
		21: { AVALIACAO1: process.env.MODULO1_LINK },
		22: { LINKDONNA: await getTinyUrl(process.env.LINK_DONNA) },
		23: {
			EMAILMENTORIA: process.env.EMAILMENTORIA,
			MOD3_LASTDAY: '',
			MOD3_2DIAS: '',
		},
		24: { AVALIACAO2: process.env.MODULO2_LINK },
		25: {
			SONDAGEMPOS: process.env.SONDAGEM_POS_LINK,
			DISC_LINK: await getTinyUrl(process.env.DISC_LINK2),
			TURMA: '',
			MOD3_7DIAS: '',
		},
		26: {
			AVALIADORPOS: process.env.AVALIADOR360POS_LINK,
			MOD3_7DIAS: '',
		},
		27: {
			MOD3_7DIAS: '',
			AVALIADORPOS: process.env.AVALIADOR360POS_LINK,
			MOD3_LASTDAY: '',
		},
		28: {
			NUMBERWHATSAP: process.env.NUMBERWHATSAP,
			MOD3_LASTDAY: '',
		},
		29: { AVALIACAO3: process.env.MODULO3_LINK },
		30: { AVALIACAO3: process.env.MODULO3_LINK },
		31: {
			MODULOAVISAR: '', LOCAL: '', DATAHORA: '', ATIVIDADESCOMPLETAS: '',
		},
		32: {},
	};
}

module.exports = {
	getSendDate, buildParametersRules, getNotificationRules, buildNotificationRules,
};
