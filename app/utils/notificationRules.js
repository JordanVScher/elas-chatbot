const { reloadSpreadSheet } = require('./helper');
const { sentryError } = require('./helper');

// relation of keys from the spreadsheet and the model attributes
const turmaMap = {
	tipo: 'notification_type',
	modulo: 'modulo',
	dias: 'days',
	horas: 'hours',
	minutos: 'minutes',
	'reenvio(dias)': 'reminderDate',
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
			if (['true', 'TRUE'].includes(aux)) aux = true;
			if (['false', 'FALSE'].includes(aux)) aux = false;
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
async function loadTabNotificationRules(isInCompany) {
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

// build the regular rule set, based on the spreadsheet
async function buildNotificationRules() {
	try {
		const abas = ['normal', 'in_company'];

		const rules = [];
		for (let j = 0; j < abas.length; j++) {
			const aba = abas[j];
			rules[aba] = [];
			const spreadsheet = await reloadSpreadSheet(j + 1);

			if (spreadsheet && spreadsheet.length > 0) {
				for (let i = 0; i < spreadsheet.length; i++) {
					const e = spreadsheet[i];
					const query = await buildQuery(e, turmaMap);
					if (query) rules[aba].push(query);
				}
			}
		}

		return rules;
	} catch (error) {
		sentryError('Erro em buildNotificationRules', error);
		return null;
	}
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

/**
 * Searches for words matching the regex in the three notification texts
 * @param {json} notification the notification object
 * @returns {array} the parameters keys that will be replaced by the actual values
 */
async function buildParametersRules(notificationType) {
	let text = '';
	if (notificationType.email_subject) text += `${notificationType.email_subject}\n`;
	if (notificationType.email_text) text += `${notificationType.email_text}\n`;
	if (notificationType.chatbot_text) text += `${notificationType.chatbot_text}\n`;
	const regex = new RegExp(/\[.*?\]/g);
	let keysFound = text.match(regex);
	if (!keysFound) return [];
	keysFound = await keysFound.map((x) => { // remove brackets and turn every var name to uppercase
		x = x.replace('[', '').replace(']', '');
		return x ? x.toUpperCase() : x;
	});

	return [...new Set(keysFound)] || keysFound;
}


module.exports = {
	getSendDate, buildParametersRules, buildNotificationRules, loadTabNotificationRules,
};
