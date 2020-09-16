const { sentryError } = require('./helper');
const notificationRules = require('../server/models').notification_rules;

// build the regular rule set, based on the database
async function buildNotificationRules() {
	try {
		const allRules = await notificationRules.findAll({ order: [['id', 'ASC']], raw: true }).then((res) => res).catch((err) => sentryError('Erro em notificationRules.findall', err));

		const rules = [];
		rules.normal = [];
		rules.in_company = [];

		allRules.forEach((e) => {
			const timeChange = [];
			if (typeof e.days === 'number') timeChange.push({ qtd: e.days, type: 'days' });
			if (typeof e.hours === 'number') timeChange.push({ qtd: e.hours, type: 'hours' });
			if (typeof e.minutes === 'number') timeChange.push({ qtd: e.minutes, type: 'minutes' });

			delete e.days;
			delete e.hours;
			delete e.minutes;
			delete e.createdAt;
			delete e.updatedAt;

			if (!e.reminderDate) delete e.reminderDate;
			if (!e.indicado) delete e.indicado;
			if (!e.familiar) delete e.familiar;
			if (!e.sunday) delete e.sunday;

			e.timeChange = timeChange;
			let typeRule = 'normal';
			if (e.notification_type > 16) typeRule = 'in_company';

			rules[typeRule].push(e);
		});

		return rules;
	} catch (error) {
		sentryError('Erro em buildNotificationRules', error);
		return null;
	}
}

// build the regular rule set, based on the database
async function loadTabNotificationRules(isInCompany) {
	const rules = await buildNotificationRules();
	if (isInCompany) return rules.in_company;
	return rules.normal;
}

// return the sum of the module date (from the turma) with the notification rule
async function getSendDate(ourTurma, currentRule) {
	if (!currentRule.timeChange || currentRule.timeChange.length === 0) return false;

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
