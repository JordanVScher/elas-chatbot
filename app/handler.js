const MaAPI = require('./chatbot_api');
// const opt = require('./utils/options');
const db = require('./utils/DB_helper');
const { sendHTMLMail } = require('./utils/mailer');
const { createIssue } = require('./utils/send_issue');
const DF = require('./utils/dialogFlow');
const { sendWarningCSV } = require('./utils/admin_menu/warn_admin');
const dialogs = require('./utils/dialogs');
const attach = require('./utils/attach');
const flow = require('./utils/flow');
const help = require('./utils/helper');
const timers = require('./utils/timers');
const { checkUserOnLabel } = require('./utils/postback');
const { updateTurmas } = require('./utils/turma');
const labels = require('./utils/labels');
const { sendTestNotification } = require('./utils/notificationTest');

module.exports = async (context) => {
	try {
		if (!context.state.dialog || context.state.dialog === '' || (context.event.postback && context.event.postback.payload === 'greetings')) { // because of the message that comes from the comment private-reply
			await context.setState({ dialog: 'greetings' });
		}
		await context.setState({ chatbotData: await MaAPI.getChatbotData(context.event.rawEvent.recipient.id) });
		// console.log('context.state.chatbotData', context.state.chatbotData);
		if (context.state.matricula === true) {
			await MaAPI.postRecipient(context.state.chatbotData.user_id, await help.buildRecipientObj(context));
		}
		db.upsertUser(context.session.user.id, `${context.session.user.first_name} ${context.session.user.last_name}`);
		// MaAPI.getRecipient(context.state.chatbotData.user_id, context.session.user.id);
		await timers.deleteTimers(context.session.user.id);

		if (context.event.isPostback) {
			await context.setState({ lastPBpayload: context.event.postback.payload });
			if (context.state.lastPBpayload === 'teste') {
				// await context.setState({ dialog: 'adminMenu' });
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
				await MaAPI.logAnsweredPoll(context.session.user.id, context.state.chatbotData.user_id, context.state.answer);
				await context.sendText('Agradecemos sua resposta.');
				await context.setState({ answer: '', dialog: 'mainMenu' });
			} else if (context.state.lastQRpayload === 'adminMenu') {
				if (await checkUserOnLabel(context.session.user.id, process.env.ADMIN_LABEL_ID)) {
					await context.setState({ dialog: 'adminMenu' });
				} else {
					await context.sendText(flow.adminMenu.notAdmin); await context.setState({ dialog: 'greetings' });
				}
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
			} else if (context.state.whatWasTyped === process.env.MAIL_TEST) {
				if (await checkUserOnLabel(context.session.user.id, process.env.ADMIN_LABEL_ID)) {
					await dialogs.mailTest(context);
				}
			} else if (context.state.whatWasTyped === process.env.RELOAD_SPREAD) {
				if (await checkUserOnLabel(context.session.user.id, process.env.ADMIN_LABEL_ID)) {
					await updateTurmas();
				}
			} else if (context.state.dialog === 'jaSouAluna') {
				await context.sendImage(flow.jaSouAluna.gif1);
				await dialogs.handleCPF(context);
			} else if (context.state.dialog === 'verTurma' || context.state.dialog === 'alunosTurmaCSV') {
				if (await checkUserOnLabel(context.session.user.id, process.env.ADMIN_LABEL_ID)) {
					await context.setState({ searchTurma: await db.getTurmaID(context.state.whatWasTyped), dialog: 'alunosTurmaCSV' });
				} else {
					await context.sendText(flow.adminMenu.notAdmin); await context.setState({ dialog: 'greetings' });
				}
			} else if (['CPFNotFound', 'invalidCPF', 'validCPF'].includes(context.state.dialog)) {
				await dialogs.handleCPF(context);
			} else if (context.state.whatWasTyped.toLowerCase() === process.env.RESET && process.env.ENV !== 'prod') {
				if (context.state.gotAluna && context.state.gotAluna.turma) {
					await labels.unlinkUserToLabelByName(context.session.user.id, context.state.gotAluna.turma, context.state.chatbotData.fb_access_token);
				}
				await context.setState({ recipient: await MaAPI.getRecipient(context.state.chatbotData.user_id, context.session.user.id) });
				if (context.state.recipient.extra_fields.labels) {
					context.state.recipient.extra_fields.labels.forEach(async (element) => {
						await MaAPI.deleteRecipientLabel(context.state.chatbotData.user_id, context.session.user.id, element.name);
					});
				}
				await context.setState({ matricula: '', gotAluna: '' });
			} else if (context.state.dialog === 'graficoMedia') {
				await context.setState({ dialog: 'graficoMediaEnd' });
			} else if (['graficoZipEnd', 'graficoZip'].includes(context.state.dialog)) {
				await context.setState({ dialog: 'graficoZipEnd' });
			} else if (context.state.dialog === 'mudarTurma') {
				await dialogs.adminAlunaCPF(context, 'mudarAskTurma');
			} else if (context.state.dialog === 'removerAluna') {
				await dialogs.adminAlunaCPF(context, 'removerAlunaConfirma');
			} else if (context.state.dialog === 'mudarAskTurma') {
				await dialogs.mudarAskTurma(context, context.state.chatbotData.fb_access_token);
			} else if (context.state.dialog === 'simularAskCPF') {
				await context.setState({ simuladorCPF: await help.getCPFValid(context.state.whatWasTyped) });
				if (context.state.simuladorCPF) {
					await context.setState({ simuladorAluna: await db.getAlunaFromCPF(context.state.simuladorCPF) });
					if (!context.state.simuladorAluna) {
						await context.sendText(`Aluna com CPF ${context.state.simuladorCPF} não encontrada`);
					} else if (context.state.simuladorAluna && !context.state.simuladorAluna.turma_id) {
						await context.sendText(`Aluna ${context.state.simuladorAluna.nome_completo} não está em nenhuma turma. Ela não pode receber as notificações.`);
						await context.setState({ dialog: 'adminMenu' });
					} else {
						await context.setState({ dialog: 'simularNotificacao' });
					}
				} else {
					await context.sendText('CPF inválido.');
				}
			} else if (['sendFeedback', 'sendFeedbackConfirm'].includes(context.state.dialog)) {
				await context.setState({ dialog: 'sendFeedbackConfirm' });
			} else {
				await DF.dialogFlow(context);
			}
		} else if (context.event.isFile && context.event.file && context.event.file.url) {
			await dialogs.checkReceivedFile(context);
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
		case 'trocarTurma':
			await context.sendText(flow.trocarTurma.text1);
			await context.sendText(flow.trocarTurma.text2, await attach.getQR(flow.trocarTurma));
			break;
		case 'queroTrocar':
			await context.sendText(flow.trocarTurma.text3);
			await dialogs.warnAlunaTroca(context.state.gotAluna);
			await dialogs.sendMainMenu(context);
			break;
		case 'queroSerAluna':
			await context.sendText(flow.queroSerAluna.text1);
			await attach.sendCards(context, flow.queroSerAluna.cards, 'Ver Mais');
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
			await context.sendText(flow.invalidCPF.text1);
			await context.sendText(flow.invalidCPF.text2, await attach.getQR(flow.invalidCPF));
			break;
		case 'CPFNotFound':
			await context.sendText(flow.CPFNotFound.text1, await attach.getQR(flow.CPFNotFound));
			break;
		case 'confirmaMatricula':
			await db.linkUserToCPF(context.session.user.id, context.state.cpf);
			await MaAPI.postRecipient(context.state.chatbotData.user_id, await help.buildRecipientObj(context));
			await MaAPI.postRecipientLabel(context.state.chatbotData.user_id, context.session.user.id, context.state.gotAluna.turma);
			await labels.linkUserToLabelByName(context.session.user.id, context.state.gotAluna.turma, context.state.chatbotData.fb_access_token, true);

			await context.setState({ matricula: true, agendaData: await dialogs.getAgenda(context, await db.getTurmaFromID(context.state.gotAluna.turma_id)) });
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
			await context.setState({ gotAluna: await db.getAlunaFromFBID(context.session.user.id) });
			await context.setState({ ourTurma: await db.getTurmaFromID(context.state.gotAluna.turma_id) });
			await context.setState({ mod1Date: context.state.ourTurma.horario_modulo1 });
			await context.sendText(flow.Atividade2.text1.replace('[MOD1_15DIAS]', await help.formatDiasMod(context.state.mod1Date, -15)));
			await attach.sendAtividade2Cards(context, flow.Atividade2.cards, context.state.cpf);
			await context.sendText(flow.Atividade2.text2.replace('[MOD1_2DIAS]', await help.formatDiasMod(context.state.mod1Date, -2)), await attach.getQR(flow.Atividade2));
			await context.setState({ spreadsheet: '', ourTurma: '', mod1Date: '' });
			break;
		case 'mail6pt2':
			await context.sendText(flow.mail6pt2.text1, await attach.getQR(flow.mail6pt2));
			break;
		case 'mail6pt3':
			await context.sendText(flow.mail6pt3.text1.replace('<LINK_ANEXO>', await help.getTinyUrl(process.env.ANEXO_MAIL06)), await attach.getQR(flow.mail6pt3));
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
			await context.sendText(await help.getTinyUrl(process.env.CSV_ALUNA_EXAMPLE_LINK));
			await context.sendText(flow.adminMenu.inserirAlunas.txt2, await attach.getQR(flow.adminMenu.inserirAlunas));
			break;
		case 'createAlunos': {
			const result = await dialogs.receiveCSVAluno(context.state.csvLines, context.state.chatbotData.user_id, context.state.chatbotData.fb_access_token);
			if (result) {
				await dialogs.sendFeedbackMsgs(context, result.errors, flow.adminMenu.feedback.aluna);
			} else {
				await context.sendText(flow.adminMenu.inserirAlunas.invalidFile, await attach.getQR(flow.adminMenu.inserirAlunas));
			}
			await context.setState({ csvLines: '' });
		}
			break;
		case 'inserirAvaliadores':
			await context.sendText(flow.adminMenu.inserirAvaliadores.txt1);
			await context.sendText(await help.getTinyUrl(process.env.CSV_AVALI_EXAMPLE_LINK));
			await context.sendText(flow.adminMenu.inserirAvaliadores.txt2, await attach.getQR(flow.adminMenu.inserirAvaliadores));
			break;
		case 'createAvaliadores': {
			const result = await dialogs.receiveCSVAvaliadores(context.state.csvLines);
			if (result) {
				await dialogs.sendFeedbackMsgs(context, result.errors, flow.adminMenu.feedback.indicado);
			} else {
				await context.sendText(flow.adminMenu.inserirAvaliadores.invalidFile, await attach.getQR(flow.adminMenu.inserirAvaliadores));
			}
			await context.setState({ csvLines: '' });
		}
			break;
		case 'verTurma':
			await context.sendText(flow.adminMenu.verTurma.txt1, await attach.getQR(flow.adminMenu.verTurma));
			break;
		case 'avisoResposta':
			await context.sendText(flow.adminMenu.avisoResposta.txt1, await attach.getQR(flow.adminMenu.verTurma));
			await context.typing(3000);
			await sendWarningCSV(true);
			break;
		case 'alunosTurmaCSV':
			if (context.state.searchTurma) {
				for (let i = 0; i < Object.keys(flow.adminCSV).length; i++) {
					const element = Object.keys(flow.adminCSV)[i];
					await context.setState({ dialog: element });
					await dialogs.sendCSV(context, context.state.searchTurma);
				}
				await context.sendText(flow.adminMenu.verTurma.txt2, await attach.getQR(flow.adminMenu.verTurma));
				await context.setState({ dialog: 'alunosTurmaCSV' });
			} else {
				await context.sendText(flow.adminMenu.verTurma.noTurma, await attach.getQR(flow.adminMenu.verTurma));
			}
			break;
		case 'mudarTurma':
			await context.sendText(flow.adminMenu.mudarTurma.txt1, await attach.getQR(flow.adminMenu.mudarTurma));
			break;
		case 'mudarAskTurma': {
			let text = flow.adminMenu.mudarTurma.txt2;
			if (context.state.adminAlunaFound.turma) text += flow.adminMenu.mudarTurma.txt3.replace('<NOME>', context.state.adminAlunaFound.nome_completo.trim()).replace('<TURMA>', context.state.adminAlunaFound.turma);
			await context.sendText(text, await attach.getQR(flow.adminMenu.verTurma));
		} break;
		case 'updateTurma': {
			const feedback = await updateTurmas();
			await context.setState({ csvLines: feedback && feedback.results ? feedback.results.length : 0 });
			if (feedback && feedback.results && feedback.results.length > 0) await context.sendText(feedback.results.join('\n'), await attach.getQR(flow.adminMenu.atualizarTurma));
			if (feedback && feedback.errors && feedback.errors.length > 0) await dialogs.sendFeedbackMsgs(context, feedback.errors, '', flow.adminMenu.atualizarTurma);
		} break;
		case 'removerAluna':
			await context.sendText(flow.adminMenu.removerAluna.txt1, await attach.getQR(flow.adminMenu.removerAluna));
			break;
		case 'removerAlunaConfirma':
			if (context.state.adminAlunaFound.turma) {
				let text = flow.adminMenu.removerAlunaConfirma.txt1;
				text += flow.adminMenu.removerAlunaConfirma.txt2.replace('<NOME>', context.state.adminAlunaFound.nome_completo.trim()).replace('<TURMA>', context.state.adminAlunaFound.turma);
				await context.sendText(text, await attach.getQR(flow.adminMenu.removerAlunaConfirma));
			} else {
				await context.sendText(flow.adminMenu.removerAlunaConfirma.noTurma.replace('<NOME>', context.state.adminAlunaFound.nome_completo.trim()), await attach.getQR(flow.adminMenu.firstMenu));
			}
			break;
		case 'removerAlunaFim':
			await dialogs.removerAluna(context);
			break;
		case 'graficos':
			await context.sendText(flow.adminMenu.graficos.txt1, await attach.getQR(flow.adminMenu.graficos));
			break;
		case 'graficoMedia':
			await context.sendText(flow.adminMenu.graficos.txt2, await attach.getQR(flow.adminMenu.verTurma));
			break;
		case 'graficoMediaEnd':
			await dialogs.graficoMediaEnd(context);
			break;
		case 'graficoZip':
			await context.sendText(flow.adminMenu.graficos.txt3, await attach.getQR(flow.adminMenu.verTurma));
			break;
		case 'graficoZipEnd':
			await dialogs.graficoZipEnd(context);
			break;
		case 'sendFeedback':
			await context.sendText(flow.adminMenu.sendFeedback.askTurma);
			break;
		case 'sendFeedbackConfirm':
			await dialogs.sendFeedbackConfirm(context);
			break;
		case 'sendFeedbackFim':
			await dialogs.sendFeedbackFim(context.state.feedbackTurmaID, await db.getTurmaInCompany(context.state.feedbackTurmaID));
			await context.sendText(flow.adminMenu.sendFeedback.fim);
			await context.sendText(flow.adminMenu.firstMenu.txt1, await attach.getQR(flow.adminMenu.firstMenu));
			break;
		case 'simularNotificacao':
			await context.sendText(flow.adminMenu.simularNotificacao.intro, await attach.getQR(flow.adminMenu.simularNotificacao));
			break;
		case 'simularAskCPF':
			await context.sendText(flow.adminMenu.simularNotificacao.askCPF, await attach.getQR(flow.adminMenu.verTurma));
			break;
		case 'simularAll':
			await sendTestNotification(context.state.simuladorAluna.cpf);
			await context.sendText('Aguarde', await attach.getQR(flow.adminMenu.verTurma));
			break;
		case 'simularTrilha':
			await sendTestNotification('41734249811', false, false, [3, 10, 12, 15, 16]);
			await context.sendText('Aguarde', await attach.getQR(flow.adminMenu.verTurma));
			break;
		case 'simularIndicado':
			await sendTestNotification(context.state.simuladorAluna.cpf, false, true);
			await context.sendText('Aguarde', await attach.getQR(flow.adminMenu.verTurma));
			break;
		case 'simular24H':
			await sendTestNotification(context.state.simuladorAluna.cpf, 15);
			await context.sendText('Aguarde', await attach.getQR(flow.adminMenu.verTurma));
			break;
		case 'simular1H':
			await sendTestNotification(context.state.simuladorAluna.cpf, 16);
			await context.sendText('Aguarde', await attach.getQR(flow.adminMenu.verTurma));
			break;
		case 'notificationOn':
			await MaAPI.updateBlacklistMA(context.session.user.id, 1);
			await MaAPI.logNotification(context.session.user.id, context.state.chatbotData.user_id, 3);
			await context.sendText(flow.notifications.on);
			break;
		case 'notificationOff':
			await MaAPI.updateBlacklistMA(context.session.user.id, 0);
			await MaAPI.logNotification(context.session.user.id, context.state.chatbotData.user_id, 4);
			await context.sendText(flow.notifications.off);
			break;
		} // end switch case
	} catch (error) {
		await context.sendText('Ops. Tive um erro interno. Tente novamente.'); // warning user
		const date = new Date();
		const errorMsg = `Parece que aconteceu um erro as ${date.toLocaleTimeString('pt-BR')} de ${date.getDate()}/${date.getMonth() + 1} com ${context.session.user.name} => \n${error.stack}`;
		if (process.env.ENV !== 'local') await sendHTMLMail(`Erro no bot do ELAS - ${process.env.ENV || ''}`, process.env.MAILDEV, errorMsg);
		console.log('errorMsg', errorMsg);
		await help.Sentry.configureScope(async (scope) => { // sending to sentry
			scope.setUser({ username: context.session.user.first_name });
			scope.setExtra('state', context.state);
			throw error;
		});
	} // catch
}; // handler function
