const { getTinyUrl } = require('./helper');

async function getNotificationRules() {
	if (process.env.ENV === 'homol') {
		return [
			{ notification_type: 1, modulo: 1, timeChange: [{ qtd: -2, type: 'days' }] },
			{ notification_type: 2, modulo: 1, timeChange: [{ qtd: -2, type: 'days' }] },
			{ notification_type: 3, modulo: 1, timeChange: [{ qtd: -1, type: 'days' }], indicado: true, reminderDate: 6 }, // eslint-disable-line object-curly-newline
			{ notification_type: 4, modulo: 1, timeChange: [{ qtd: -1, type: 'days' }] },
			{ notification_type: 5, modulo: 1, timeChange: [{ qtd: 1, type: 'days' }, { qtd: 20, type: 'hours' }] }, // 20 hours after the second day of class
			{ notification_type: 6, modulo: 2, timeChange: [{ qtd: -1, type: 'days' }] },
			{ notification_type: 7, modulo: 2, timeChange: [{ qtd: 1, type: 'days' }] }, // on the second class
			{ notification_type: 8, modulo: 2, timeChange: [{ qtd: 1, type: 'days' }, { qtd: 20, type: 'hours' }] }, // 20 hours after the second day of class
			{ notification_type: 9, modulo: 3, timeChange: [{ qtd: -2, type: 'days' }] },
			{ notification_type: 10, modulo: 3, timeChange: [{ qtd: -2, type: 'days' }], indicado: true, reminderDate: 3 }, // eslint-disable-line object-curly-newline
			{ notification_type: 11, modulo: 3, timeChange: [{ qtd: -2, type: 'days' }] },
			{ notification_type: 12, modulo: 3, timeChange: [{ qtd: -2, type: 'days' }], indicado: true, familiar: true }, // eslint-disable-line object-curly-newline
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
	return [
		{ notification_type: 1, modulo: 1, timeChange: [{ qtd: -19, type: 'days' }] },
		{ notification_type: 2, modulo: 1, timeChange: [{ qtd: -19, type: 'days' }] },
		{ notification_type: 3, modulo: 1, timeChange: [{ qtd: -10, type: 'days' }], indicado: true, reminderDate: 6 }, // eslint-disable-line object-curly-newline
		{ notification_type: 4, modulo: 1, timeChange: [{ qtd: -10, type: 'days' }] },
		{ notification_type: 5, modulo: 1, timeChange: [{ qtd: 1, type: 'days' }, { qtd: 20, type: 'hours' }] }, // 20 hours after the second day of class
		{ notification_type: 6, modulo: 2, timeChange: [{ qtd: -12, type: 'days' }] },
		{ notification_type: 7, modulo: 2, timeChange: [{ qtd: 1, type: 'days' }] }, // on the second class
		{ notification_type: 8, modulo: 2, timeChange: [{ qtd: 1, type: 'days' }, { qtd: 20, type: 'hours' }] }, // 20 hours after the second day of class
		{ notification_type: 9, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }] },
		{ notification_type: 10, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }], indicado: true, reminderDate: 3 }, // eslint-disable-line object-curly-newline
		{ notification_type: 11, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }] },
		{ notification_type: 12, modulo: 3, timeChange: [{ qtd: -7, type: 'days' }], indicado: true, familiar: true }, // eslint-disable-line object-curly-newline
		{ notification_type: 13, modulo: 3, timeChange: [{ qtd: 1, type: 'days' }, { qtd: 20, type: 'hours' }] }, // 20 hours after the second day of class
		{ notification_type: 14, modulo: 3, timeChange: [{ qtd: 5, type: 'days' }] },
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
	};
}

module.exports = {
	getSendDate, buildParametersRules, getNotificationRules,
};
