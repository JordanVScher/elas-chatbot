const db = require('./DB_helper');
const help = require('./helper');
const { sentryError } = require('./helper');
const { sendAlunaToAssistente } = require('./sm_help');
const attach = require('./attach');
const flow = require('./flow');
const admin = require('./admin_menu/admin_helper');
const { sendTestNotification } = require('./notificationTest');
const { alunos } = require('../server/models');
const { turma } = require('../server/models');
const { addNewNotificationAlunas } = require('./notificationAddQueue');
const { addNewNotificationIndicados } = require('./notificationAddQueue');
const { updateTurmas } = require('./turma');

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

module.exports.getAgenda = async (context, userTurma) => {
	const result = {};
	if (!userTurma) return false;
	const today = new Date();
	result.turmaNome = userTurma.nome;
	result.local = userTurma.local;

	for (let i = 1; i <= 3; i++) { // loop through all 3 modules we have
		const newDate = userTurma[`horario_modulo${i}`] || userTurma[`modulo${i}`]; // get date for the start of each module

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

	return result;
};

module.exports.buildAgendaMsg = async (data) => {
	let msg = '';
	if (data.turmaNome) msg = `📝 Sua Turma: ${data.turmaNome}\n`;
	if (data.currentModule) msg += `💡 Você está no módulo ${data.currentModule} de 3\n`;
	if (data.newDate) msg += `🗓️ Sua aula acontecerá ${data.newDateDay} dia ${await help.formatDate(data.newDate)} e ${data.nextDateDay} dia ${help.formatDate(data.nextDate)}\n`;
	if (data.local) msg += `🏠 Local: ${await help.toTitleCase(data.local)}`;

	return msg;
};


module.exports.sendCSV = async (context) => {
	const turmaID = context.state.searchTurma;
	let result = '';
	switch (context.state.dialog) {
	case 'alunosTurmaCSV':
		result = await db.getAlunasReport(turmaID);
		result = await admin.addTurmaTransferenceCSV(result);
		break;
	case 'alunosRespostasCSV': {
		const firstResult = await db.getAlunasRespostasReport(turmaID);
		result = { content: [], input: turmaID };
		result.content = await admin.formatRespostasCSV(firstResult.content, 'Respondido');
		break;
	}
	case 'indicadosCSV':
		result = await db.getAlunasIndicadosReport(turmaID);
		break;
	default:
		break;
	}

	result.content = await admin.putColumnsLast(result.content, ['Criado em', 'Atualizado em']);
	result = await admin.buildCSV(result, flow.adminCSV[context.state.dialog]);

	if (!result || result.error || !result.csvData) {
		await context.sendText(result.error);
	} else {
		await context.sendText(flow.adminCSV[context.state.dialog].txt1);
		await context.sendFile(result.csvData, { filename: result.filename || 'seu_arquivo.csv' });
	}
};

module.exports.sendFeedbackMsgs = async (context, errors) => {
	const feedbackMsgs = await admin.getFeedbackMsgs(context.state.csvLines.length - errors.length, errors);
	for (let i = 0; i < feedbackMsgs.length; i++) {
		const element = feedbackMsgs[i];
		if (i === 1) {
			await context.sendText('Aconteceram alguns erros, o número da linha exibido abaixo é contando com o header do CSV');
		}
		await context.sendText(element, await attach.getQR(flow.adminMenu.inserirAlunas));
	}
};


module.exports.receiveCSVAluno = async (csvLines, chatbotUserId, pageToken) => { // createAlunos/ inserir
	if (csvLines) {
		const turmas = await turma.findAll({ where: {}, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em turma.findAll', err));
		const errors = []; // stores lines that presented an error

		for (let i = 0; i < csvLines.length; i++) {
			let element = csvLines[i];
			if (element.Turma) {
				element.Turma = await turmas.find((x) => x.nome === element.Turma.toUpperCase()); // find the turma that has that name
				element.turma_id = element.Turma ? element.Turma.id : false; // get that turma id
			} // convert turma as name to turma as id

			if (element.Turma && element.turma_id) { // check valid turma
				element = await admin.convertCSVToDB(element, admin.swap(admin.alunaCSV));
				if (element.nome_completo) { // check if aluno has the bare minumium to be added to the database
					element.cpf = await help.getCPFValid(element.cpf); // format cpf
					if (!element.cpf) {
						errors.push({ line: i + 2, msg: 'CPF inválido!' });
						help.sentryError('Erro em receiveCSVAluno => CPF inválido!', { element });
					} else {
						const oldAluno = await alunos.findOne({ where: { cpf: element.cpf }, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em alunos.findOne', err));
						// if aluno existed before we save the turma and label change
						if (oldAluno) { await admin.SaveTurmaChange(chatbotUserId, pageToken, oldAluno.id, oldAluno.turma_id, element.turma_id); }
						if (!oldAluno) { await sendAlunaToAssistente(element.email, element.cpf); }
						element.added_by_admin = true;
						const newAluno = await db.upsertAlunoCadastro(element);
						// const newAluno = await db.addAlunaFromCSV(element);
						if (!newAluno || newAluno.error || !newAluno.id) { // save line where error happended
							errors.push({ line: i + 2, msg: 'Erro ao salvar no banco' });
							help.sentryError('Erro em receiveCSVAluno => Erro ao salvar no banco', { element });
						} else {
							await admin.NotificationChangeTurma(newAluno.id, element.turma_id);
						}
					}
				} else {
					errors.push({ line: i + 2, msg: 'Falta o nome da aluna' });
					help.sentryError('Erro em receiveCSVAluno => aluna sem nome', { element });
				}
			} else {
				errors.push({ line: i + 2, msg: `Turma ${element.Turma || ''} inválida` });
				help.sentryError('Erro em receiveCSVAluno => turma inválida', { element });
			}
		}
		return { errors };
	}
	return help.sentryError('Erro em receiveCSVAluno => CSV inválido!', { csvLines });
};


async function receiveCSVAvaliadores(csvLines) {
	if (csvLines) {
		const errors = []; // stores lines that presented an error
		const indicados = [];
		for (let i = 0; i < csvLines.length; i++) {
			let element = csvLines[i];
			element = await admin.convertCSVToDB(element, admin.swap(admin.avaliadorCSV));

			if (element.nome && element.email && element.aluno_cpf) {
				const avaliadorAluno = await alunos.findOne({ where: { cpf: element.aluno_cpf.toString() }, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em avaliadorAluno.findOne', err));
				if (avaliadorAluno) {
					element.aluno_id = avaliadorAluno.id;
					element = await admin.formatBooleanToDatabase(element, 'Sim', 'Não', ['familiar']);
					const newIndicado = await db.upsertIndicado(element);
					if (!newIndicado || newIndicado.error || !newIndicado.id) { // save line where error happended
						errors.push({ line: i + 2, msg: 'Erro ao salvar no banco' });
						help.sentryError('Erro em receiveCSV => Erro ao salvar no banco', { element });
					} else {
						indicados.push(newIndicado);
					}
				} else {
					errors.push({ line: i + 2, msg: `Nenhuma aluna com CPF ${element.aluno_cpf}` });
					help.sentryError('Erro em receiveCSVAvaliadores => Avaliador sem nome ou e-mail ou cpf do aluno', { element });
				}
			} else {
				errors.push({ line: i + 2, msg: `Avaliador sem ${await admin.getMissingDataAvaliadoresCSV(element)}.` });
				help.sentryError(`Erro em receiveCSVAvaliadores => Avaliador sem ${await admin.getMissingDataAvaliadoresCSV(element)}.`, { element });
			}
		}

		await admin.updateNotificationIndicados(indicados);
		return { errors };
	}
	return help.sentryError('Erro em receiveCSVAluno => CSV inválido!', { csvLines });
}
module.exports.receiveCSVAvaliadores = receiveCSVAvaliadores;

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

module.exports.mudarAskTurma = async (context, pageToken) => {
	await context.setState({ desiredTurma: context.state.whatWasTyped });
	const validTurma = await db.getTurmaID(context.state.desiredTurma); // get the id that will be user for the transfer

	if (!validTurma) { // if theres no id then it's not a valid turma
		await context.sendText(flow.adminMenu.mudarTurma.turmaInvalida);
	} else {
		const transferedAluna = await alunos.update({ turma_id: validTurma }, { where: { cpf: context.state.adminAlunaFound.cpf } }).then(() => true).catch((err) => sentryError('Erro em mudarAskTurma update', err));
		if (transferedAluna) {
			await admin.NotificationChangeTurma(context.state.adminAlunaFound.id, validTurma);
			await admin.SaveTurmaChange(context.state.chatbotData.user_id, pageToken, context.state.adminAlunaFound.id, context.state.adminAlunaFound.turma_id, validTurma);
			await context.sendText(flow.adminMenu.mudarTurma.transferComplete.replace('<TURMA>', context.state.desiredTurma));
			const count = await alunos.count({ where: { turma_id: validTurma } })
				.then((alunas) => alunas).catch((err) => sentryError('Erro em mudarAskTurma getCount', err));
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

module.exports.updateTurma = async (context) => {
	const result = await updateTurmas();
	await context.sendText(result.join('\n'), await attach.getQR(flow.adminMenu.verTurma));
};


module.exports.checkReceivedFile = admin.checkReceivedFile;
