const MaAPI = require('./chatbot_api');
// const opt = require('./utils/options');
const db = require('./utils/DB_helper');
const { createIssue } = require('./utils/send_issue');
const { checkPosition } = require('./utils/dialogFlow');
const { apiai } = require('./utils/helper');
const dialogs = require('./utils/dialogs');
const attach = require('./utils/attach');
const flow = require('./utils/flow');
const help = require('./utils/helper');
const timers = require('./utils/timers');
const { checkUserOnLabel } = require('./utils/postback');

module.exports = async (context) => {
	try {
		// console.log(await MaAPI.getLogAction()); // print possible log actions
		if (!context.state.dialog || context.state.dialog === '' || (context.event.postback && context.event.postback.payload === 'greetings')) { // because of the message that comes from the comment private-reply
			await context.setState({ dialog: 'greetings' });
		}
		await context.setState({ chatbotData: await MaAPI.getChatbotData(context.event.rawEvent.recipient.id) });
		// we update context data at every interaction that's not a comment or a post
		await MaAPI.postRecipient(context.state.chatbotData.user_id, {
			fb_id: context.session.user.id,
			name: `${context.session.user.first_name} ${context.session.user.last_name}`,
			origin_dialog: 'greetings',
			picture: context.session.user.profile_pic,
			// session: JSON.stringify(context.state),
		});
		db.upsertUser(context.session.user.id, `${context.session.user.first_name} ${context.session.user.last_name}`);
		await timers.deleteTimers(context.session.user.id);

		if (context.event.isPostback) {
			await context.setState({ lastPBpayload: context.event.postback.payload });
			if (context.state.lastPBpayload === 'teste') {
				await context.setState({ dialog: 'adminMenu' });
				// await context.setState({ dialog: 'sendFirst' });
			} else {
				await context.setState({ dialog: context.state.lastPBpayload });
				await MaAPI.logFlowChange(context.session.user.id, context.state.chatbotData.user_id,
					context.event.postback.payload, context.event.postback.title);
			}
		} else if (context.event.isQuickReply) {
			await context.setState({ lastQRpayload: context.event.quickReply.payload });
			if (context.state.lastQRpayload.slice(0, 4) === 'poll') { // user answered poll that came from timer
				await context.setState({ answer: context.event.message.quick_reply.payload.replace('poll', '') });
				await MaAPI.postPollAnswer(context.session.user.id, context.state.answer, 'dialog');
				await MaAPI.logAnsweredPoll(context.session.user.id, context.state.politicianData.user_id, context.state.answer);
				await context.sendText('Agradecemos sua resposta.');
				await context.setState({ answer: '', dialog: 'mainMenu' });
			} else {
				await context.setState({ dialog: context.state.lastQRpayload });
				await MaAPI.logFlowChange(context.session.user.id, context.state.chatbotData.user_id,
					context.event.message.quick_reply.payload, context.event.message.quick_reply.payload);
			}
		} else if (context.event.isText) {
			await context.setState({ whatWasTyped: context.event.message.text });
			if (context.state.whatWasTyped === process.env.ADMIN_KEYWORD) {
				if (await checkUserOnLabel(context.session.user.id, process.env.ADMIN_LABEL_ID)) {
					await context.setState({ dialog: 'adminMenu' });
				} else {
					await context.sendText(flow.adminMenu.notAdmin); await context.setState({ dialog: 'greetings' });
				}
			} else if (context.state.dialog === 'jaSouAluna') {
				await context.sendImage(flow.jaSouAluna.gif1);
				await dialogs.handleCPF(context);
			} else if (context.state.dialog === 'verTurma' || context.state.dialog === 'alunosTurmaCSV') {
				if (await checkUserOnLabel(context.session.user.id, process.env.ADMIN_LABEL_ID)) {
					await context.setState({ searchTurma: context.state.whatWasTyped, dialog: 'alunosTurmaCSV' });
				} else {
					await context.sendText(flow.adminMenu.notAdmin); await context.setState({ dialog: 'greetings' });
				}
			} else if (['CPFNotFound', 'invalidCPF', 'validCPF'].includes(context.state.dialog)) {
				await dialogs.handleCPF(context);
			} else if (context.state.whatWasTyped.toLowerCase() === process.env.RESET && process.env.ENV !== 'prod') {
				await context.setState({ matricula: '', gotAluna: '' });
			} else if (context.state.dialog === 'mudarTurma') {
				await dialogs.adminAlunaCPF(context);
			} else if (context.state.dialog === 'mudarAskTurma') {
				await dialogs.mudarAskTurma(context);
			} else {
				console.log('--------------------------');
				console.log(`${context.session.user.first_name} ${context.session.user.last_name} digitou ${context.event.message.text}`);
				console.log('Usa dialogflow?', context.state.chatbotData.use_dialogflow);
				if (context.state.chatbotData.use_dialogflow === 1) { // check if chatbot is using dialogFlow
					await context.setState({ apiaiResp: await apiai.textRequest(await help.formatDialogFlow(context.state.whatWasTyped), { sessionId: context.session.user.id }) });
					// await context.setState({ resultParameters: context.state.apiaiResp.result.parameters }); // getting the entities
					await context.setState({ intentName: context.state.apiaiResp.result.metadata.intentName }); // getting the intent
					await checkPosition(context);
				} else { // not using dialogFlow
					await context.setState({ dialog: 'createIssueDirect' });
				}
			}
		} else if (context.event.isFile && context.event.file && context.event.file.url) {
			if (context.state.dialog === 'inserirAlunas' || context.state.dialog === 'createAlunos') { // on this dialog we can receive a file
				if (await checkUserOnLabel(context.session.user.id, process.env.ADMIN_LABEL_ID)) { // for safety reasons we check if the user is an admin again
					await context.setState({ dialog: 'createAlunos', fileURL: context.event.file.url.replace('https', 'http') });
				} else {
					await context.sendText(flow.adminMenu.notAdmin); await context.setState({ dialog: 'greetings' });
				}
			}
		}

		switch (context.state.dialog) {
		case 'greetings':
			if (context.state.matricula === true) {
				await dialogs.sendMainMenu(context);
			} else {
				await context.sendText(flow.greetings.text1.replace('<first_name>', context.session.user.first_name));
				await context.sendText(flow.greetings.text2);
				await context.sendText(flow.greetings.text3, await attach.getQR(flow.greetings));
			}
			break;
		case 'mainMenu':
			await dialogs.sendMainMenu(context);
			break;
		case 'sobreElas':
			await context.sendText(flow.sobreElas.text1);
			await context.sendText(flow.sobreElas.text2);
			await context.sendText(flow.sobreElas.text3);
			await context.sendImage(flow.sobreElas.gif1);
			if (context.state.matricula === true) {
				await dialogs.sendMainMenu(context);
			} else {
				await context.sendText(flow.greetings.text3, await attach.getQR(flow.sobreElas));
			}
			break;
		case 'queroSerAluna':
			await context.sendText(flow.queroSerAluna.text1);
			await attach.sendSequenceMsgs(context, flow.queroSerAluna.cards, 'Ver Mais');
			await context.sendText(flow.queroSerAluna.text2);
			await context.sendText(flow.queroSerAluna.text3);
			await context.sendText(flow.greetings.text3, await attach.getQR(flow.queroSerAluna));
			break;
		case 'jaSouAluna':
			await context.sendText(flow.jaSouAluna.text1);
			await context.sendText(flow.jaSouAluna.text2);
			await context.sendText(flow.jaSouAluna.text3);
			break;
		case 'validCPF':
			if (context.state.gotAluna) {
				await context.sendText(flow.jaSouAluna.validCPF.replace('<name>', context.state.gotAluna.nome_completo).replace('<turma>', context.state.gotAluna.turma.replace('turma', '')),
					await attach.getQR(flow.jaSouAluna));
			} else {
				await context.sendText('Não achei sua turma');
			}
			break;
		case 'invalidCPF':
			await context.sendText(flow.jaSouAluna.invalidCPF1);
			await context.sendText(flow.jaSouAluna.invalidCPF2);
			break;
		case 'CPFNotFound':
			await context.sendText('Ainda não tenho esse CPF! Digite de novo!');
			break;
		case 'confirmaMatricula':
			await db.linkUserToCPF(context.session.user.id, context.state.cpf);
			await context.setState({ agendaData: await dialogs.getAgenda(context), matricula: true });
			await context.sendText(flow.confirmaMatricula.text1);
			await context.sendText(await dialogs.buildAgendaMsg(context.state.agendaData), await attach.getQR(flow.confirmaMatricula));
			break;
		case 'afterConfirma':
			await context.sendText(flow.confirmaMatricula.after1);
			await dialogs.sendMainMenu(context);
			break;
		case 'erradoMatricula':
			await db.linkUserToCPF(context.session.user.id, '');
			await context.sendText(flow.erradoMatricula.text1, await attach.getQR(flow.erradoMatricula));
			break;
		case 'talkToElas':
			await context.sendText(flow.talkToElas.text1);
			await context.sendText(flow.talkToElas.text2);
			await context.sendText(flow.talkToElas.text3);
			break;
		case 'falarDonna':
			await context.sendText('Escreva suas dúvidas que eu vou tentar responder.');
			await timers.createFalarDonnaTimer(context.session.user.id, context);
			break;
		case 'Atividade2':
			await context.setState({ spreadsheet: await help.getFormatedSpreadsheet() });
			await context.setState({ ourTurma: await context.state.spreadsheet.find(x => x.turma === context.state.gotAluna.turma) });
			await context.setState({ mod1Date: context.state.ourTurma['módulo1'] });
			await context.sendText(flow.Atividade2.text1.replace('[MOD1_15DIAS]', await help.formatDiasMod(context.state.mod1Date, -15)));
			await attach.sendAtividade2Cards(context, flow.Atividade2.cards, context.state.cpf);
			await context.sendText(flow.Atividade2.text2.replace('[MOD1_2DIAS]', await help.formatDiasMod(context.state.mod1Date, -2)), await attach.getQR(flow.Atividade2));
			await context.setState({ spreadsheet: '', ourTurma: '', mod1Date: '' });
			break;
		case 'mail6pt2':
			await context.sendText(flow.mail6pt2.text1, await attach.getQR(flow.mail6pt2));
			break;
		case 'mail6pt3':
			await context.sendText(flow.mail6pt3.text1.replace('<LINK_ANEXO>', process.env.ANEXO_MAIL06), await attach.getQR(flow.mail6pt3));
			break;
		case 'fim':
			await context.sendText('fim');
			break;
		case 'createIssueDirect':
			await createIssue(context);
			break;
		// adminMenu -----------------------------------------------------------------------------
		case 'adminMenu':
			await context.sendText(flow.adminMenu.firstMenu.txt1, await attach.getQR(flow.adminMenu.firstMenu));
			break;
		case 'inserirAlunas':
			await context.sendText(flow.adminMenu.inserirAlunas.txt1);
			await context.sendText(process.env.CSV_EXEMPLE_LINK);
			await context.sendText(flow.adminMenu.inserirAlunas.txt2, await attach.getQR(flow.adminMenu.inserirAlunas));
			break;
		case 'createAlunos':
			await dialogs.receiveCSV(context);
			break;
		case 'verTurma':
			await context.sendText(flow.adminMenu.verTurma.txt1, await attach.getQR(flow.adminMenu.verTurma));
			break;
		case 'alunosTurmaCSV':
			for (let i = 0; i < Object.keys(flow.adminCSV).length; i++) {
				const element = Object.keys(flow.adminCSV)[i];
				await context.setState({ dialog: element });
				await dialogs.sendCSV(context, 'T7-SP');
			}
			await context.sendText(flow.adminMenu.verTurma.txt2, await attach.getQR(flow.adminMenu.verTurma));
			await context.setState({ dialog: 'alunosTurmaCSV' });
			break;
		case 'mudarTurma':
			await context.sendText(flow.adminMenu.mudarTurma.txt1, await attach.getQR(flow.adminMenu.mudarTurma));
			break;
		case 'mudarAskTurma':
			await context.sendText(flow.adminMenu.mudarTurma.txt2.replace('<NOME>', context.state.adminAlunaFound.nome_completo).replace('<TURMA>', context.state.adminAlunaFound.turma), await attach.getQR(flow.adminMenu.verTurma));
			break;
		} // end switch case
	} catch (error) {
		await context.sendText('Ops. Tive um erro interno. Tente novamente.'); // warning user
		const date = new Date();
		console.log(`Parece que aconteceu um erro as ${date.toLocaleTimeString('pt-BR')} de ${date.getDate()}/${date.getMonth() + 1} =>`, error);

		await help.Sentry.configureScope(async (scope) => { // sending to sentry
			scope.setUser({ username: context.session.user.first_name });
			scope.setExtra('state', context.state);
			throw error;
		});
	} // catch
}; // handler function
