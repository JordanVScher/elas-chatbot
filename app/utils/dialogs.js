const db = require('./DB_helper');
const help = require('./helper');
const attach = require('./attach');
const flow = require('./flow');

module.exports.sendMainMenu = async (context, txtMsg) => {
	const text = txtMsg || flow.mainMenu.defaultText;
	let opt = [];

	if (context.state.matricula === true) {
		opt = await attach.getQR(flow.mainMenu);
	} else {
		opt = await attach.getQR(flow.greetings);
	}

	await context.sendText(text, opt);
};

module.exports.handleCPF = async (context) => {
	const cpf = context.state.whatWasTyped.replace(/[_.,-]/g, '');
	if ((cpf.length === 11 && parseInt(cpf, 10)) === false) {
		await context.setState({ dialog: 'invalidCPF' });
	} else if (await db.checkCPF(cpf) === false) { // check if this cpf exists
		await context.setState({ dialog: 'CPFNotFound' });
	} else {
		await context.setState({ cpf, gotTurma: await db.getUserTurma(context.session.user.id) });
		await context.setState({ dialog: 'validCPF' });
	}
};


module.exports.getAgenda = async (context) => {
	const result = {};
	const spreadsheet = await help.reloadSpreadSheet(1, 6);
	const onTheTurma = await spreadsheet.find(x => x.turma === context.state.turma);

	if (onTheTurma) {
		result.local = onTheTurma.local; // the local
		const today = new Date();

		for (let i = 1; i <= 3; i++) { // loop through all 3 modules we have
			let newDate = onTheTurma[`módulo${i}`]; // get date for the start of each module
			newDate = newDate ? await help.getJsDateFromExcel(newDate) : ''; // convert excel date if we have a date
			if (newDate) {
				if (await help.moment(newDate).format('YYYY-MM-DD') >= await help.moment(today).format('YYYY-MM-DD')) { // check if the date for this module is after today or today
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
	if (data.newDate) { msg += `🗓️ Acontecerá ${data.newDateDay} dia ${await help.formatDate(data.newDate)} e ${data.nextDateDay} dia ${help.formatDate(data.nextDate)}\n`; }
	if (data.local) { msg += `🏠 Local: ${await help.toTitleCase(data.local)}`; }

	return msg;
};
