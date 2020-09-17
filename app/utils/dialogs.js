const fs = require('fs');
const AdmZip = require('adm-zip');
const { sendHTMLMail } = require('./mailer');
const db = require('./DB_helper');
const help = require('./helper');
const { sentryError } = require('./helper');
const { sendAlunaToAssistente } = require('./labels');
const { sendMatricula } = require('./surveys/questionario_followUp');
const { helpAddQueue } = require('./notificationAddQueue');
const attach = require('./attach');
const flow = require('./flow');
const admin = require('./admin_menu/admin_helper');
const { sendTestNotification } = require('./notificationTest');
const { alunos } = require('../server/models');
const { turma } = require('../server/models');
const indicados = require('../server/models').indicacao_avaliadores;
const { addNewNotificationAlunas } = require('./notificationAddQueue');
// const { addNewNotificationIndicados } = require('./notificationAddQueue');
const charts = require('./charts');
const broadcast = require('./broadcast');

module.exports.checkReceivedFile = admin.checkReceivedFile;

async function sendMainMenu(context, txtMsg) {
	const text = txtMsg || flow.mainMenu.defaultText;
	let opt = [];

	if (context.state.matricula === true) {
		opt = await attach.getQR(flow.mainMenu);
	} else {
		opt = await attach.getQR(flow.greetings);
	}

	await context.sendText(text, opt);
}

module.exports.sendMainMenu = sendMainMenu;

module.exports.handleCPF = async (context) => {
	const cpf = await help.getCPFValid(context.state.whatWasTyped);
	if (!cpf) {
		await context.setState({ dialog: 'invalidCPF' });
	} else if (await db.checkCPF(cpf) === false) { // check if this cpf exists
		await context.setState({ dialog: 'CPFNotFound' });
	} else {
		await context.setState({ cpf, gotAluna: await db.getAlunaFromCPF(cpf) });
		await context.setState({ dialog: 'validCPF' });
	}
};

module.exports.getAgenda = async (userTurma) => {
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

				let hour = result.newDate.getHours() + 3;
				hour = typeof hour === 'number' ? hour.toString() : hour;
				if (hour && hour.length === 1) hour = `0${hour}`;

				let minutes = result.newDate.getMinutes();
				console.log('minutes', minutes);
				minutes = typeof minutes === 'number' ? minutes.toString() : minutes;
				if (minutes && minutes.length === 1) minutes = `0${minutes}`;

				if (hour && minutes) result.horario = `${hour}:${minutes}`;

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
	if (data.turmaNome) msg = `📝 Sua Turma: ${data.turmaNome}`;
	if (data.currentModule) msg += `\n💡 Você está no módulo ${data.currentModule} de 3`;
	if (data.newDate) msg += `\n🗓️ Sua aula acontecerá ${data.newDateDay} dia ${await help.formatDate(data.newDate)} e ${data.nextDateDay} dia ${help.formatDate(data.nextDate)}`;
	if (data.horario) msg += ` às ${data.horario}`;
	if (data.local) msg += `\n🏠 Local: ${await help.toTitleCase(data.local)}`;

	return msg;
};

async function warnAlunaTroca(alunaData) {
	const subject = flow.trocarTurma.mailSubject.replace('<NOME>', alunaData.nome_completo);
	let mailText = flow.trocarTurma.mailText.replace('<TURMA>', alunaData.turma).replace('<NOME>', alunaData.nome_completo);
	let aux = '';

	if (alunaData.nome_completo) aux += `\nNome: ${alunaData.nome_completo}`;
	if (alunaData.turma) aux += `\nTurma: ${alunaData.turma}`;
	if (alunaData.telefone) aux += `\nTelefone: ${alunaData.telefone}`;
	if (alunaData.email) aux += `\nE-mail: ${alunaData.email}`;
	if (alunaData.cpf) aux += `\nCPF: ${alunaData.cpf}`;

	if (aux) mailText += `\nDados da aluna: \n${aux}`;

	let html = await fs.readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
	html = await html.replace('[CONTEUDO_MAIL]', mailText);

	const eMailToSend = await help.getMailAdmin();
	// await sendHTMLMail(subject, eMailToSend, html, null, mailText);
}

module.exports.warnAlunaTroca = warnAlunaTroca;

// build e-mail to warn aluna of removal from turma
async function warnAlunaRemocao(alunaData) {
	const subject = flow.adminMenu.removerAlunaFim.mailSubject.replace('<TURMA>', alunaData.turma);
	const mailText = flow.adminMenu.removerAlunaFim.mailText.replace('<TURMA>', alunaData.turma).replace('<NOME>', alunaData.nome_completo);

	let html = await fs.readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
	html = await html.replace('[CONTEUDO_MAIL]', mailText);

	// await sendHTMLMail(subject, alunaData.email, html, null, mailText);
}

// build e-mail to warn admins of aluna removal from turma, add the name of the admin that made the request
async function warnAdminOfAlunaRemocao(alunaData, adminNome) {
	const subject = flow.adminMenu.removerAlunaFim.adminMailSubject.replace('<TURMA>', alunaData.turma).replace('<NOME>', alunaData.nome_completo);
	const mailText = flow.adminMenu.removerAlunaFim.adminMailText.replace('<TURMA>', alunaData.turma).replace('<NOME>', alunaData.nome_completo).replace('<ADMIN>', adminNome);

	let html = await fs.readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
	html = await html.replace('[CONTEUDO_MAIL]', mailText);

	// await sendHTMLMail(subject, process.env.MAILELAS, html, null, mailText);
}

module.exports.removerAluna = async (context) => {
	const feedback = await db.removeAlunaFromTurma(context.state.adminAlunaFound.id);
	if (!feedback) {
		await context.sendText(flow.adminMenu.removerAlunaFim.erro.replace('<NOME>', context.state.adminAlunaFound.nome_completo.trim()).replace('<TURMA>', context.state.adminAlunaFound.turma), await attach.getQR(flow.adminMenu.removerAlunaFim));
	} else {
		if (context.state.adminAlunaFound.email) await warnAlunaRemocao(context.state.adminAlunaFound);
		await admin.NotificationChangeTurma(context.state.adminAlunaFound.id, context.state.adminAlunaFound.turma_id, null);
		await admin.SaveTurmaChange(
			context.state.chatbotData.user_id, context.state.chatbotData.fb_access_token, context.state.adminAlunaFound.id, context.state.adminAlunaFound.turma_id, null,
		);
		await warnAdminOfAlunaRemocao(context.state.adminAlunaFound, context.state.sessionUser.name);
		await context.sendText(flow.adminMenu.removerAlunaFim.success.replace('<NOME>', context.state.adminAlunaFound.nome_completo.trim()).replace('<TURMA>', context.state.adminAlunaFound.turma));
		await context.sendText(flow.adminMenu.firstMenu.txt1, await attach.getQR(flow.adminMenu.firstMenu));
	}
};

module.exports.sendCSV = async (context) => { // verTurma
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
	case 'turmaLinksCSV':
		result = await admin.getTurmaLinks(turmaID);
		result = { content: await admin.removeUndefined(result), input: turmaID };
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

module.exports.sendStatus = async (context, turmaID, name) => {
	try {
		const data = await admin.getStatusData(turmaID);
		const res = await admin.anotherCSV(data, name);
		if (res && !res.error && res.csvData) {
			await context.sendFile(res.csvData, { filename: res.filename || 'seu_arquivo.csv' });
		}
	} catch (error) {
		console.log('Erro ao enviar o csv de status', error);
	}
};

module.exports.sendStatusIndicado = async (context, turmaID, name) => {
	try {
		const data = await admin.getStatusDataIndicados(turmaID);
		const res = await admin.anotherCSV(data, name);
		if (res && !res.error && res.csvData) {
			await context.sendFile(res.csvData, { filename: res.filename || 'seu_arquivo.csv' });
		}
	} catch (error) {
		console.log('Erro ao enviar o csv de status', error);
	}
};

module.exports.sendFeedbackMsgs = async (context, errors, msgs, quickReplies) => {
	// because some erros can be ignored at the error count (but not on the error listing) we get the number of mandatory errors
	const notIgnoredErrorsLength = errors.filter((x) => !x.ignore).length;
	const feedbackMsgs = await admin.getFeedbackMsgs(context.state.csvLines.length - notIgnoredErrorsLength, errors, msgs);
	for (let i = 0; i < feedbackMsgs.length; i++) {
		const element = feedbackMsgs[i];
		if (i === 1) {
			await context.sendText('Aconteceram alguns erros, o número da linha exibido abaixo é contando com o header do CSV/Planilha');
		}
		await context.sendText(element, await attach.getQR(quickReplies || flow.adminMenu.inserirAlunas));
	}
};

module.exports.receiveCSVAluno = async (csvLines, chatbotUserId, pageToken) => { // createAlunos/ inserir
	if (csvLines) {
		const turmas = await turma.findAll({ where: {}, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em turma.findAll', err));
		const errors = []; // stores lines that presented an error

		for (let i = 0; i < csvLines.length; i++) {
			let element = csvLines[i];
			try {
				if (element.Turma) {
					element.Turma = await turmas.find((x) => (x.nome.toUpperCase() === element.Turma.toUpperCase())); // find the turma that has that name
					element.turma_id = element.Turma ? element.Turma.id : false; // get that turma id
				} // convert turma as name to turma as id
				if (element.Turma && element.turma_id) { // check valid turma
					element = await admin.convertCSVToDB(element, admin.swap(admin.alunaCSV));
					if (element.nome_completo) { // check if aluno has the bare minumium to be added to the database
						element.cpf = await help.getCPFValid(element.cpf); // format cpf
						if (!element.cpf) {
							errors.push({ line: i + 2, msg: 'CPF inválido!' });
							help.sentryError('Erro em receiveCSVAluno => CPF inválido!', { element });
						} else if (!element.email) {
							errors.push({ line: i + 2, msg: 'Email inválido!' });
							help.sentryError('Erro em receiveCSVAluno => Email inválido!', { element });
						} else {
							const oldAluno = await alunos.findOne({ where: { cpf: element.cpf }, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em alunos.findOne', err));
							// if aluno existed before we save the turma and label change
							if (oldAluno && oldAluno.turma_id) {
								await admin.SaveTurmaChange(chatbotUserId, pageToken, oldAluno.id, oldAluno.turma_id, element.turma_id);
								element.added_by_admin = true;
							}
							const newAluno = await db.upsertAlunoCadastro(element);
							if (!oldAluno) { // send matricula to new aluno and create queue
								await sendMatricula(element.Turma.nome, false, element.email, element.cpf, element.Turma.inCompany);
								await helpAddQueue(newAluno.id, newAluno.turma_id);
							}
							await sendAlunaToAssistente(element.nome_completo, element.email, element.cpf, element.Turma.nome);
							if (!newAluno || newAluno.error || !newAluno.id) { // save line where error happended
								errors.push({ line: i + 2, msg: 'Erro ao salvar no banco' });
								help.sentryError('Erro em receiveCSVAluno => Erro ao salvar no banco', { element });
							} else {
								if (newAluno.email === newAluno.contato_emergencia_email) {
									errors.push({ line: i + 2, msg: `Contato de emergência tem o mesmo e-mail da aluna ${newAluno.nome_completo}: ${newAluno.contato_emergencia_email}`, ignore: true });
								}
								if (oldAluno && oldAluno.turma_id) await admin.NotificationChangeTurma(newAluno.id, oldAluno.turma_id, element.turma_id);
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
			} catch (error) {
				errors.push({ line: i + 2, msg: 'Erro desconhecido' });
				help.sentryError('Erro em receiveCSVAluno ', error);
			}
		}
		return { errors };
	}
	return help.sentryError('Erro em receiveCSVAluno => CSV inválido!', { csvLines });
};


module.exports.receiveCSVAvaliadores = async (csvLines) => {
	if (csvLines) {
		const errors = []; // stores lines that presented an error
		const indicadosToAdd = [];
		for (let i = 0; i < csvLines.length; i++) {
			let e = csvLines[i];
			try {
				e = await admin.convertCSVToDB(e, admin.swap(admin.avaliadorCSV));
				e.aluno_cpf = await help.getCPFValid(e.aluno_cpf);
				if (e && e.id) {
					const indicadoFound = await indicados.findOne({ where: { id: e.id }, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em avaliadorAluno.findOne', err));
					if (indicadoFound && indicadoFound.id && Number.isInteger(indicadoFound.id)) {
						e = await admin.formatBooleanToDatabase(e, 'Sim', 'Nao', ['familiar']);

						const updatedIndicado = await indicados.update(e, { where: { id: indicadoFound.id }, returning: true, plain: true, raw: true }).then((r) => r[1]).catch((err) => { help.sentryError('Erro no update do Indicado', { err, indicadoFound, e }); }); // eslint-disable-line object-curly-newline

						if (!updatedIndicado || !updatedIndicado.id) errors.push({ line: i + 2, msg: 'Erro ao salvar no banco' });
						if (updatedIndicado && updatedIndicado.id) indicadosToAdd.push(updatedIndicado);
					} else {
						errors.push({ line: i + 2, msg: `Indicado com ID '${e.id}' não encontrado!` });
					}
				} else if (e.nome && e.email && e.aluno_cpf) {
					const avaliadorAluno = await alunos.findOne({ where: { cpf: e.aluno_cpf }, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em avaliadorAluno.findOne', err));

					if (avaliadorAluno && avaliadorAluno.id) {
						e.aluno_id = avaliadorAluno.id;
						e = await admin.formatBooleanToDatabase(e, 'Sim', 'Nao', ['familiar']);

						const newIndicado = await db.upsertIndicadoByEmail(e, e.email);

						if (!newIndicado || !newIndicado.id) errors.push({ line: i + 2, msg: 'Erro ao salvar no banco' });
						if (newIndicado && newIndicado.error) errors.push({ line: i + 2, msg: newIndicado.error });

						if (newIndicado && newIndicado.id) {
							if (newIndicado.email === avaliadorAluno.email) errors.push({ line: i + 2, msg: `Adicionado Indicado ${newIndicado.nome} com mesmo e-mail da aluna ${avaliadorAluno.nome_completo}: ${avaliadorAluno.email}`, ignore: true });
							indicadosToAdd.push(newIndicado);
						}
					} else {
						errors.push({ line: i + 2, msg: `Nenhuma aluna com CPF ${e.aluno_cpf} encontrada` });
					}
				} else {
					errors.push({ line: i + 2, msg: `Avaliador sem ${await admin.getMissingDataAvaliadoresCSV(e)}.` });
				}
			} catch (error) {
				errors.push({ line: i + 2, msg: 'Erro desconhecido' });
			}
		}

		await admin.updateNotificationIndicados(indicadosToAdd);
		if (errors && errors.length > 0) await help.sentryError('Erros receiveCSVAvaliadores', errors);
		return { errors };
	}
	return help.sentryError('Erro em receiveCSVAluno => CSV inválido!', { csvLines });
};

module.exports.adminAlunaCPF = async (context, nextDialog) => {
	await context.setState({ adminAlunaCPF: await help.getCPFValid(context.state.whatWasTyped) });
	if (!context.state.adminAlunaCPF) {
		await context.sendText(flow.adminMenu.mudarTurma.invalidCPF);
	} else {
		await context.setState({ adminAlunaFound: await db.getAlunaFromCPF(context.state.adminAlunaCPF) });
		if (!context.state.adminAlunaFound) {
			await context.sendText(flow.adminMenu.mudarTurma.alunaNotFound);
		} else {
			await context.sendText(flow.adminMenu.mudarTurma.alunaFound + await help.buildAlunaMsg(context.state.adminAlunaFound));
			await context.setState({ dialog: nextDialog });
		}
	}
};

async function mudarTurmaMail(alunaNome, turmaVelha, turmaNova, alunaEmail) {
	const velhaNome = await db.getTurmaName(turmaVelha);
	const novaNome = await db.getTurmaName(turmaNova);

	const adminText = `Olá, a aluna ${alunaNome} foi transferida da turma ${velhaNome} para a turma ${novaNome} por uma administradora.`;
	const alunaText = `Olá, ${alunaNome}. Você foi transferida para a turma ${novaNome}.`;

	let html = await fs.readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
	let html2 = html;
	html2 = await html2.replace('[CONTEUDO_MAIL]', alunaText);
	html = await html.replace('[CONTEUDO_MAIL]', adminText);

	const adminMail = await help.getMailAdmin();

	// await sendHTMLMail('Elas - Aluna transferida', adminMail, html, null, adminText);
	// await sendHTMLMail('Elas - Você foi transferida', alunaEmail, html2, null, alunaText);
}


module.exports.mudarAskTurma = async (context, pageToken) => {
	await context.setState({ desiredTurma: context.state.whatWasTyped });
	const validTurma = await db.getTurmaID(context.state.desiredTurma); // get the id that will be user for the transfer

	if (!validTurma) { // if theres no id then it's not a valid turma
		await context.sendText(flow.adminMenu.mudarTurma.turmaInvalida);
	} else {
		const transferedAluna = await alunos.update({ turma_id: validTurma }, { where: { cpf: context.state.adminAlunaFound.cpf }, raw: true, plain: true, returning: true }).then((r) => r[1]).catch((err) => sentryError('Erro em mudarAskTurma update', err)); // eslint-disable-line object-curly-newline
		if (transferedAluna) {
			const turmaNome = await db.getTurmaName(validTurma);
			await admin.NotificationChangeTurma(context.state.adminAlunaFound.id, context.state.adminAlunaFound.turma_id, validTurma);
			await admin.SaveTurmaChange(context.state.chatbotData.user_id, pageToken, context.state.adminAlunaFound.id, context.state.adminAlunaFound.turma_id, validTurma);
			await context.sendText(flow.adminMenu.mudarTurma.transferComplete.replace('<TURMA>', turmaNome));
			const count = await alunos.count({ where: { turma_id: validTurma } })
				.then((alunas) => alunas).catch((err) => sentryError('Erro em mudarAskTurma getCount', err));
			if (count !== false) { await context.sendText(flow.adminMenu.mudarTurma.turmaCount.replace('<COUNT>', count).replace('<TURMA>', turmaNome)); }
			await mudarTurmaMail(transferedAluna.nome_completo, context.state.adminAlunaFound.turma_id, transferedAluna.turma_id, transferedAluna.email);
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
			// await addNewNotificationIndicados(aluna.id, aluna.turma_id);
			await context.sendText('Pronto! As notificações começarão a ser mandadas em 30 segundos. Se não começarem a chegar, mande a palavra-chave novamente.');
		}
	} else {
		await context.sendText('Não consegui estabelecer o vínculo entre seu usuário no chatbot e alguma aluna cadastrada. Tente se vincular através do seu PDF, entre no fluxo Já Sou Aluna e se cadastre.');
	}
};

module.exports.graficoMediaEnd = async (context) => {
	await context.setState({ desiredTurma: context.state.whatWasTyped });
	const validTurma = await db.getTurmaID(context.state.desiredTurma);
	if (!validTurma) { // if theres no id then it's not a valid turma
		await context.sendText(flow.adminMenu.sendFeedbackZip.turmaInvalida);
	} else {
		const turmaPDF = { filename: `${context.state.desiredTurma}_sondagem.pdf` };
		turmaPDF.content = await charts.buildTurmaChart(validTurma);

		console.log('turmaPDF', turmaPDF);
		if (!turmaPDF || !turmaPDF.content) {
			await context.sendText(flow.adminMenu.graficos.failure);
		} else {
			turmaPDF.content = await charts.formatSondagemPDF(turmaPDF.content, context.state.desiredTurma);
			const chatbotError = await broadcast.sendFiles(context.session.user.id, null, turmaPDF);
			if (!chatbotError) {
				await context.sendText(flow.adminMenu.graficos.success);
				await context.sendText(flow.adminMenu.firstMenu.txt1, await attach.getQR(flow.adminMenu.firstMenu));
			} else {
				await context.sendText(flow.adminMenu.graficos.failure);
				await context.sendText(flow.adminMenu.graficos.txt2, await attach.getQR(flow.adminMenu.verTurma));
				sentryError(`${flow.adminMenu.graficos.failure} => ${validTurma}`, chatbotError);
			}
		}
	}
};

async function sendZipMail(file, turmaName, adminNome, docs) {
	const subject = flow.adminMenu.sendFeedbackZip.mailSubject.replace('<TURMA>', turmaName);
	let mailText = flow.adminMenu.sendFeedbackZip.mailText.replace('<TURMA>', turmaName).replace('<ADMIN>', adminNome);

	let errorText = '';
	docs.forEach((e) => { if (e.error) { errorText += `\n${e.aluno}: ${e.error}`; } });
	if (errorText) { mailText += `\n\n\nErros que aconteceram durante o processo: \n${errorText}`; }

	let html = await fs.readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
	html = await html.replace('[CONTEUDO_MAIL]', mailText);

	if (file) {
		return sendHTMLMail(subject, process.env.MAILDEV, html, [{ filename: file.filename, content: file.content }], mailText);
		// return sendHTMLMail(subject, process.env.MAILELAS, html, [{ filename: file.filename, content: file.content }], mailText);
	}
	return sendHTMLMail(subject, process.env.MAILDEV, html, null, mailText);
	// return sendHTMLMail(subject, process.env.MAILELAS, html, null, mailText);
}


async function zipAllDocs(context, turmaID, turmaName) {
	const docs = await charts.buildAlunosDocs(turmaID);
	if (docs && docs.length > 0) {
		let sendZip = false; // send the zip file only if it has one file

		const zip = new AdmZip(); // load zip buffer
		for (let i = 0; i < docs.length; i++) {
			const e = docs[i];
			if (e.sondagem) zip.addFile(`${e.aluno}_sondagem.pdf`, await fs.readFileSync(e.sondagem)); sendZip = true;
			if (e.avaliador360) zip.addFile(`${e.aluno}_360Results.pdf`, await fs.readFileSync(e.avaliador360)); sendZip = true;
		}

		const file = sendZip ? { filename: `${turmaName}_graficos.zip`, content: zip.toBuffer() } : false;
		const error = await sendZipMail(file, turmaName, context.state.sessionUser.name, docs);

		if (!error) {
			await context.sendText(flow.adminMenu.sendFeedbackZip.success.replace('<TURMA>', turmaName));

			if (context.state.sessionUser && context.state.sessionUser.name && context.state.sessionUser.name.includes('Jordan')) {
				const chatbotError = await broadcast.sendZip(context.session.user.id, file);
				if (chatbotError) await context.sendText(chatbotError);
			}

			await context.sendText(flow.adminMenu.firstMenu.txt1, await attach.getQR(flow.adminMenu.firstMenu));
		} else {
			await context.sendText(flow.adminMenu.sendFeedbackZip.failure.replace('<TURMA>', turmaName));
			await context.sendText(flow.adminMenu.graficos.txt3, await attach.getQR(flow.adminMenu.verTurma));
		}
	} else {
		await context.sendText(flow.adminMenu.sendFeedbackZip.noDocs.replace('<TURMA>', turmaName));
		await context.sendText(flow.adminMenu.graficos.txt3, await attach.getQR(flow.adminMenu.verTurma));
	}
}


module.exports.graficoZipEnd = async (context) => {
	await context.setState({ desiredTurma: context.state.whatWasTyped });
	const validTurma = await db.getTurmaID(context.state.desiredTurma);
	if (!validTurma) { // if theres no id then it's not a valid turma
		await context.sendText(flow.adminMenu.sendFeedbackZip.turmaInvalida);
	} else {
		try {
			await zipAllDocs(context, validTurma, await db.getTurmaName(validTurma));
		} catch (error) {
			sentryError('Erro ao criar zip', error);
		}
	}
};
