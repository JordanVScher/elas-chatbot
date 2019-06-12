const db = require('./DB_helper');
const help = require('./helper');
const { moment } = require('./helper');

module.exports.handleCPF = async (context) => {
	const cpf = context.state.whatWasTyped.replace(/[_.,-]/g, '');
	if ((cpf.length === 11 && parseInt(cpf, 10)) === false) {
		await context.setState({ dialog: 'invalidCPF' });
	} else if (await db.checkCPF(cpf) === false) { // check if this cpf exists
		await context.setState({ dialog: 'CPFNotFound' });
	} else {
		await db.linkUserToCPF(context.session.user.id, cpf);
		await context.setState({ cpf, gotTurma: await db.getUserTurma(context.session.user.id) });
		await context.setState({ dialog: 'validCPF' });
	}
};
async function getJsDateFromExcel(excelDate) {
	if (!Number(excelDate)) {
		throw new Error('wrong input format');
	}

	const secondsInDay = 24 * 60 * 60;
	const missingLeapYearDay = secondsInDay * 1000;
	const delta = excelDate - (25567 + 2);
	const parsed = delta * missingLeapYearDay;
	const date = new Date(parsed);

	if (Object.prototype.toString.call(date) === '[object Date]') {
		if (isNaN(date.getTime())) { // eslint-disable-line
			throw new Error('wrong excel date input');
		} else {
			return date;
		}
	}

	return date;
}

module.exports.getAgenda = async (context) => {
	const result = {};
	const spreadsheet = await help.reloadSpreadSheet(1, 6);
	const onTheTurma = await spreadsheet.find(x => x.turma === context.state.turma);

	if (onTheTurma) {
		result.local = onTheTurma.local; // the local
		const today = new Date();

		for (let i = 1; i <= 3; i++) { // loop through all 3 modules we have
			let newDate = onTheTurma[`módulo${i}`]; // get date for the start of each module
			newDate = newDate ? await getJsDateFromExcel(newDate) : ''; // convert excel date if we have a date
			if (newDate) {
				if (await moment(newDate).format('YYYY-MM-DD') >= await moment(today).format('YYYY-MM-DD')) { // check if the date for this module is after today or today
					result.currentModule = i; // we loop through the modules so this index is the same number as the module
					i = 4; // we have the date already, leave the loop
					// getting the day the module starts
					result.newDate = newDate;
					result.newDateDay = help.weekDayName[result.newDate.getDay()];
					// getting the next day
					result.nextDate = new Date(newDate);
					result.nextDate.setDate(result.nextDate.getDate() + 1);
					result.nextDateDay = help.weekDayName[result.nextDate.getDay()];
				}
			}
		}
	}

	return result;
};

module.exports.buildAgendaMsg = async (data) => {
	let msg = '';
	if (data.currentModule) { msg += `📝 Você está no módulo ${data.currentModule} de 3\n`; }
	if (data.newDate) { msg += `🗓️  Acontecerá ${data.newDateDay} dia ${await help.formatDate(data.newDate)} e ${data.nextDateDay} dia ${help.formatDate(data.nextDate)}\n`; }
	if (data.local) { msg += `🏠 Local: ${await help.toTitleCase(data.local)}`; }

	return msg;
};
