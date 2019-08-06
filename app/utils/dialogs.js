const db = require('./DB_helper');
const help = require('./helper');
const attach = require('./attach');
const flow = require('./flow');
const admin = require('./admin_menu/admin_helper');


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
		await context.setState({ cpf, gotTurma: await db.getAlunaFromPDF(cpf) });
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


module.exports.sendCSV = async (context) => {
	const input = context.state.searchTurma.trim().toUpperCase();
	let result = '';
	switch (context.state.dialog) {
	case 'alunosTurmaCSV':
		result = await db.getAlunasReport(input);
		break;
	case 'alunosRespostasCSV':
		result = await db.getAlunasRespostasReport(input);
		break;
	default:
		break;
	}

	result = await admin.buildCSV(result, flow.adminCSV[context.state.dialog]);

	if (!result || result.error || !result.csvData) {
		await context.sendText(result.error);
	} else {
		await context.sendText(flow.adminCSV[context.state.dialog].txt1);
		await context.sendFile(result.csvData, { filename: result.filename || 'seu_arquivo.csv' });
	}
};


module.exports.receiveCSV = async (context) => {
	const csvLines = await admin.getJsonFromURL(context.state.fileURL);
	if (csvLines) {
		const errors = []; // stores lines that presented an error

		for (let i = 0; i < csvLines.length; i++) {
			const element = csvLines[i];
			if (!element['Nome Completo'] || !element.cpf) { // check if aluno has the bare minumium to be added tot he database
				const newAluno = await db.addAlunaFromCSV(element);
				if (!newAluno || newAluno.error || !newAluno.id) { errors.push(i + 2); } // save line where error happended
			} else {
				errors.push(i + 2);
			}
		}

		const feedbackMsgs = await admin.getFeedbackMsgs(csvLines.length - errors.length, errors);
		for (let i = 0; i < feedbackMsgs.length; i++) {
			const element = feedbackMsgs[i];
			await context.sendText(element);
		}
	} else {
		await context.sendText(flow.adminMenu.inserirAlunas.invalidFile, await attach.getQR(flow.adminMenu.inserirAlunas));
	}
};


// const test = 'http://cdn.fbsbx.com/v/t59.2708-21/64764944_673750623091868_9048548562756960256_n.csv/2019-08-02_Turma_T7-SP.csv?_nc_cat=104&_nc_oc=AQlbK1ZCCyCEj7A16L9dB56cr2cZVuULnE49ArhgFWNrUf1yH4Ceg43cHHYgqmNla8pnJbKMXSvFHInDxIfL74pe&_nc_ht=cdn.fbsbx.com&oh=eed9b3333d261501d64ef6da0f52f8a1&oe=5D4B4E38';
