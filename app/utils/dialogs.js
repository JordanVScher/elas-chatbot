const db = require('./DB_helper');
const help = require('./helper');
const { sentryError } = require('./helper');
const attach = require('./attach');
const flow = require('./flow');
const admin = require('./admin_menu/admin_helper');
const { sendTestNotification } = require('./notificationTest');
const { alunos } = require('../server/models');
const { turma } = require('../server/models');
const { addNewNotificationAlunas } = require('./notificationAddQueue');
const { addNewNotificationIndicados } = require('./notificationAddQueue');

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
	const cpf = await help.getCPFValid(context.state.whatWasTyped);
	if (!cpf) {
		await context.setState({ dialog: 'invalidCPF' });
	} else if (await db.checkCPF(cpf) === false) { // check if this cpf exists
		await context.setState({ dialog: 'CPFNotFound' });
	} else {
		await context.setState({ cpf, gotAluna: await db.getAlunaFromPDF(cpf) });
		await context.setState({ dialog: 'validCPF' });
	}
};


module.exports.getAgenda = async (context) => {
	const result = {};
	const spreadsheet = await help.reloadSpreadSheet(1, 6);
	const onTheTurma = await spreadsheet.find(x => x.turma === context.state.gotAluna.turma);

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
	const turmaID = context.state.searchTurma;
	let result = '';
	switch (context.state.dialog) {
	case 'alunosTurmaCSV':
		result = await db.getAlunasReport(turmaID);
		break;
	case 'alunosRespostasCSV':
		result = await db.getAlunasRespostasReport(turmaID);
		break;
	case 'indicadosCSV':
		result = await db.getAlunasIndicadosReport(turmaID);
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


module.exports.receiveCSV = async (context) => { // createAlunos/ inserir
	const turmas = await turma.findAll({ where: {}, raw: true }).then(res => res).catch(err => help.sentryError('Erro em turma.findAll', err));
	const csvLines = await admin.getJsonFromURL(context.state.fileURL);
	if (csvLines) {
		const errors = []; // stores lines that presented an error

		for (let i = 0; i < csvLines.length; i++) {
			const element = csvLines[i];
			if (element.Turma) {
				element.Turma = await turmas.find(x => x.nome === element.Turma); // find the turma that has that name
				element.turma_id = element.Turma ? element.Turma.id : false; // get that turma id
			} // convert turma as name to turma as id

			if (element['Nome Completo'] && element.CPF && element.turma_id) { // check if aluno has the bare minumium to be added to the database and if turma is valid(it exists)
				const newAluno = await db.addAlunaFromCSV(element);
				if (!newAluno || newAluno.error || !newAluno.id) { errors.push(i + 2); } // save line where error happended
			} else {
				errors.push(i + 2);
			}
		}

		const feedbackMsgs = await admin.getFeedbackMsgs(csvLines.length - errors.length, errors);
		for (let i = 0; i < feedbackMsgs.length; i++) {
			const element = feedbackMsgs[i];
			await context.sendText(element, await attach.getQR(flow.adminMenu.inserirAlunas));
		}
	} else {
		await context.sendText(flow.adminMenu.inserirAlunas.invalidFile, await attach.getQR(flow.adminMenu.inserirAlunas));
	}
};

module.exports.adminAlunaCPF = async (context) => {
	await context.setState({ adminAlunaCPF: await help.getCPFValid(context.state.whatWasTyped) });
	if (!context.state.adminAlunaCPF) {
		await context.sendText(flow.adminMenu.mudarTurma.invalidCPF);
	} else {
		await context.setState({ adminAlunaFound: await db.getAlunaFromPDF(context.state.adminAlunaCPF) });
		if (!context.state.adminAlunaFound) {
			await context.sendText(flow.adminMenu.mudarTurma.alunaNotFound);
		} else {
			await context.sendText(flow.adminMenu.mudarTurma.alunaFound + await help.buildAlunaMsg(context.state.adminAlunaFound));
			await context.setState({ dialog: 'mudarAskTurma' });
		}
	}
};

module.exports.mudarAskTurma = async (context) => {
	await context.setState({ desiredTurma: context.state.whatWasTyped.toUpperCase() });
	const validTurma = await db.getTurmaID(context.state.desiredTurma); // get the id that will be user for the transfer

	if (!validTurma) { // if theres no id then it's not a valid turma
		await context.sendText(flow.adminMenu.mudarTurma.turmaInvalida);
	} else {
		const transferedAluna = await alunos.update({ turma_id: validTurma }, { where: { cpf: context.state.adminAlunaFound.cpf } })
			.then(() => true).catch(err => sentryError('Erro em mudarAskTurma update', err));

		if (transferedAluna) {
			await context.sendText(flow.adminMenu.mudarTurma.transferComplete.replace('<TURMA>', context.state.desiredTurma));
			const count = await alunos.count({ where: { turma_id: validTurma } })
				.then(alunas => alunas).catch(err => sentryError('Erro em mudarAskTurma getCoun', err));
			if (count !== false) { await context.sendText(flow.adminMenu.mudarTurma.turmaCount.replace('<COUNT>', count).replace('<TURMA>', context.state.desiredTurma)); }
			await context.setState({
				dialog: 'adminMenu', desiredTurma: '', adminAlunaFound: '', adminAlunaCPF: '',
			});
		} else {
			await context.sendText(flow.adminMenu.mudarTurma.transferFailed);
		}
	}
};

module.exports.mailTest = async (context) => {
	await context.setState({ dialog: '' });
	const aluna = await db.getAlunaFromFBID(context.session.user.id);

	if (aluna && aluna.id) {
		const result = await sendTestNotification(aluna.id);
		if (result && result.qtd) {
			await context.sendText(`Sucesso, suas ${result.qtd} notificações estão sendo enviadas`);
		} else {
			await context.sendText('Você não tem notificações. Vou criar novas notificações pra você e seus indicados (Se vc tiver algum)');
			await addNewNotificationAlunas(aluna.id, aluna.turma_id);
			await addNewNotificationIndicados(aluna.id, aluna.turma_id);
			await context.sendText('Pronto! As notificações começarão a ser mandadas em 30 segundos. Se não começarem a chegar, mande a palavra-chave novamente.');
		}
	} else {
		await context.sendText('Não consegui estabelecer o vínculo entre seu usuário no chatbot e alguma aluna cadastrada. Tente se vincular através do seu PDF, entre no fluxo Já Sou Aluna e se cadastre.');
	}
};
