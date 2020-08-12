const fs = require('fs');
const aux = require('./questionario_aux');
const help = require('../helper');
const mailer = require('../mailer');
const DB = require('../DB_helper');
const { eMail } = require('../flow');
const AddQueue = require('../notificationAddQueue');
const { sendAlunaToAssistente } = require('../labels');
const { surveysMaps } = require('../sm_maps');
const donnaLog = require('../../server/models').donna_mail_log;
const matriculaLog = require('../../server/models').matricula_mail_log;
const surveysInfo = require('../sm_surveys');

// after a payement happens we send an e-mail to the buyer with the matricula/atividade 1 form
async function sendMatricula(turmaName, pagamentoID, buyerEmail, cpf, inCompany) {
	try {
		// getting the texts and questionario link, based on turma in company status
		let { link } = surveysInfo.atividade1;
		if (inCompany === true) link = surveysInfo.atividade1InCompany.link;

		let { assunto } = eMail.atividade1;
		if (inCompany === true) assunto = eMail.atividade1_inCompany.assunto;

		let { textos } = eMail.atividade1;
		if (inCompany === true) textos = eMail.atividade1_inCompany.textos;

		// format link
		if (!pagamentoID) link = link.replace('&pgid=PSIDRESPOSTA', '');
		if (cpf) link += '&cpf=CPFRESPOSTA';
		link = link.replace(/TURMARESPOSTA/g, turmaName);
		link = link.replace(/PSIDRESPOSTA/g, pagamentoID);
		link = link.replace(/CPFRESPOSTA/g, cpf);

		// build plain text version
		let mailText = '';
		textos.forEach((texto, i) => {
			mailText += `${texto}\n\n`;
			if (i === 0) mailText += '<link_atividade>\n\n';
		});
		mailText = mailText.replace(/<link_atividade>/g, link);
		mailText = mailText.replace(/TURMARESPOSTA/g, turmaName);

		// build HTML version
		let html = await fs.readFileSync(`${process.cwd()}/mail_template/ELAS_Matricula.html`, 'utf-8'); // prepare the e-mail
		html = await html.replace('[TEXTO1]', textos[0]);
		html = await html.replace('[TEXTO2]', textos[1]);
		html = await html.replace('[TEXTO3]', textos[2]);
		html = await html.replace('[TEXTO4]', textos[3]);
		html = await html.replace(/<link_atividade>/g, link); // add link to mail template
		html = await html.replace(/TURMARESPOSTA/g, turmaName); // add link to mail template

		const e = await mailer.sendHTMLMail(assunto, buyerEmail, html, null, mailText);
		await matriculaLog.create({ sentTo: buyerEmail, sentAt: new Date(), atividadeLink: link, error: e && e.stack ? e.stack : e }).then((r) => r).catch((err) => help.sentryError('Erro em matriculaLog.create', err)); // eslint-disable-line object-curly-newline
	} catch (error) {
		help.sentryError('Erro sendMatricula', { error, turmaName, pagamentoID, buyerEmail, cpf, inCompany }); // eslint-disable-line object-curly-newline
	}
}

// async function sendMissingMatriculas() {
// 	const alunas = await DB.getMissingCadastro();
// 	for (let i = 0; i < alunas.length; i++) {
// 		const e = alunas[i];
// 		await sendMatricula(e.turma_nome, e.pagamento_id, e.email, e.cpf);
// 	}
// }


async function sendDonnaMail(nome, email) {
	try {
		const hasSentAlready = await donnaLog.findOne({ where: { sentTo: email }, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro no donnaLog do model', err));
		if (!hasSentAlready || !hasSentAlready.id) { // if we already sent this e-mail to the user, we dont send it again
			let mailText = eMail.depoisMatricula.textoBody;
			let html = await fs.readFileSync(`${process.cwd()}/mail_template/ELAS_Apresentar_Donna.html`, 'utf-8');
			html = await html.replace('[nome]', nome); // add nome to mail template
			mailText = await mailText.replace('[nome]', nome); // add nome to mail template
			html = await html.replace(/<link_donna>/g, process.env.LINK_DONNA); // add chatbot link to mail template
			mailText = await mailText.replace(/<link_donna>/g, process.env.LINK_DONNA); // add chatbot link to mail template
			const e = await mailer.sendHTMLMail(eMail.depoisMatricula.assunto, email, html, null, mailText);
			await donnaLog.create({ sentTo: email, sentAt: new Date(), error: e && e.stack ? e.stack : e }).then((res) => res).catch((err) => help.sentryError('Erro em donnaLog.create', err));
		}
	} catch (error) {
		help.sentryError('Erro no sendDonnaMail', { error, nome, email });
	}
}

/**
 * @description Saves the matrícula answer and adds aluna data. This answer can't be saved more than once, multiple answers will be ignored.
 * It the answer has a pgid on it's params, the corresponding pagamento will be updated to link to the aluna.
 * If the aluna wasn't on the database before this answer, we can't properly link the resposta to the aluna on "handleResposta" so we do it here, after creating the aluna.
 * if aluna filled the same info and her email and on contato_emergencia_email we must send an e-mail warning the admins.
 * Aluna may also receive one e-mail presenting the chatbot to her, if it wasn't sent before already.
 * @param {object} answer the formated answer. Besides beign saved, this will also be used to add aluna data
 * @param {object} aluna the aluna this answer belong to
 * @returns {object|string} description of execution result
 */
async function handleAtividadeOne(answer, aluno) {
	try {
		if (aluno && aluno.id) {
			const cadastroStatus = await DB.getAlunaRespostaCadastro(aluno.id); // check if aluna has answered this questionario before
			if (cadastroStatus) throw new help.MyError('Aluna respondeu o cadastro novamente', { aluno: aluno.id, cadastroStatus });
		}

		answer.added_by_admin = false; // user wasnt added by the admins
		if (aluno.turma_id) answer.turma_id = aluno.turma_id;
		if (!aluno.turma_id && aluno.turma) {
			const turmaID = await DB.getTurmaID(aluno.turma);
			if (!turmaID) throw new help.MyError('Turma vazia em handleAtividadeOne', { turmaID, aluno });
			answer.turma_id = turmaID;
		}

		const newAluna = await DB.upsertAlunoCadastro(answer);
		if (!newAluna || !newAluna.id) throw new help.MyError('Erro ao salvar nova aluna', { newAluna, answer });

		const savedAtividade = await DB.upsertAtividade(newAluna.id, 'atividade_1', answer);
		if (!savedAtividade || !savedAtividade.id) throw new help.MyError('Erro ao salvar atividade_1', { savedAtividade, newAluna, answer });

		const updatedResposta = await DB.respostaUdpdateAlunoID(aluno.newAnswerID, newAluna.id);
		if (!updatedResposta || !updatedResposta.id) { help.sentryError('Erro ao atualizar resposta!', { updatedResposta, newAluna, answer: answer.id }); }

		if (answer.pgid && Number.isInteger(answer.pgid)) { // if matricula was answered after an user bought the course
			const savedPagamento = await DB.updateAlunoOnPagamento(answer.pgid, newAluna.id);
			if (!savedPagamento || !savedPagamento.id) { help.sentryError('Erro ao atualizar pagamento!', { savedPagamento, newAluna, answer: answer.id	}); }
		}

		await AddQueue.helpAddQueue(newAluna.id, newAluna.turma_id);
		await sendAlunaToAssistente(newAluna.nome_completo, newAluna.email, newAluna.cpf, answer.turma);
		// sending "Apresentação" mail
		sendDonnaMail(answer.nome_completo, answer.email);

		if (newAluna.email === newAluna.contato_emergencia_email) { // warn admins of aluna having save email as emergency contact
			const eMailToSend = await help.getMailAdmin();
			const eMailText = await help.getSameContatoEmailErrorText(newAluna);
			let html2 = await fs.readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
			html2 = await html2.replace('[CONTEUDO_MAIL]', eMailText);
			await mailer.sendHTMLMail(`Alerta no cadastro da Aluna ${newAluna.nome_completo}`, eMailToSend, html2, null, eMailText);
		}
		return 'Salvou matrícula com sucesso';
	} catch (error) {
		help.sentryError('Erro em handleAtividadeOne', { error, answer, aluno });
		return error;
	}
}

/**
 * @description Saves the avaliacao360 answer and creates the indicados
 * @param {object} baseAnswers the formated answer. Besides beign saved, this will also be used to create the indicados
 * @param {object} aluna the aluna this answer belong to
 * @returns {object|string} description of execution result
 */
async function saveIndicados(baseAnswers, aluna) {
	try {
		const errors = [];
		const full = surveysMaps.indicacao360;

		const indicacao360 = [];
		const familiar360 = [];
		full.forEach((e) => {
			if (e.paramName.charAt(0) !== 'F') {
				indicacao360.push(e);
			} else {
				familiar360.push(e);
			}
		});

		let indicados = {}; // could just as well be an array with the answers
		await indicacao360.forEach(async (element) => { // getting the answers for the indicados
			const temp = baseAnswers.find((x) => x.id === element.questionID);
			indicados[element.paramName] = temp && temp.text ? temp.text : '';
		});

		// formatting the answers
		const indicacao = await aux.separateAnswer(Object.values(indicados), ['nome', 'email', 'telefone']) || [];
		// saving each avaliador, if theres an e-mail
		for (let i = 0; i < indicacao.length; i++) {
			const ind = indicacao[i];
			try {
				if (ind.nome || ind.email || ind.tele) { // check if indicado has anything fulfilled
					if (!ind.email) errors.push({ id: 1, indicado: ind });
					if (ind.email && (ind.email === aluna.email)) errors.push({ id: 2, indicado: ind });
					ind.aluno_id = aluna.id; ind.familiar = false;
					await DB.upsertIndicado(ind);
				}
			} catch (error) {
				help.sentryError(`Erro ao salvar indicado ${ind.id}`, { indicado: ind, error });
			}
		}

		// getting the answers for the familiares
		indicados = {}; // cleaning up
		await familiar360.forEach(async (element) => {
			const temp = baseAnswers.find((x) => x.id === element.questionID);
			indicados[element.paramName] = temp && temp.text ? temp.text : '';
		});

		// saving each familiar
		const familiar = await aux.separateAnswer(Object.values(indicados), ['nome', 'relacao_com_aluna', 'email', 'telefone']) || [];
		for (let i = 0; i < familiar.length; i++) {
			const f = familiar[i];
			try {
				if (f.nome || f.relacao || f.email || f.tele) { // check if amiliar has anything fulfilled
					if (!f.email) errors.push({ id: 3, indicado: f });
					if (f.email && (f.email === aluna.email)) errors.push({ id: 4, indicado: f });
					f.aluno_id = aluna.id; f.familiar = true;
					await DB.upsertIndicado(f);
				}
			} catch (error) {
				help.sentryError(`Erro ao salvar familiar ${f.id} `, { familiar: f, error });
			}
		}

		// await AddQueue.addNewNotificationIndicados(aluna.id, aluna.turma_id, true);

		await DB.upsertAtividade(aluna.id, 'atividade_indicacao', baseAnswers);
		if (errors && errors.length > 0) {
			const eMailToSend = await help.getMailAdmin();
			const eMailText = await help.getIndicacaoErrorText(errors, aluna);
			let html = await fs.readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
			html = await html.replace('[CONTEUDO_MAIL]', eMailText);
			await mailer.sendHTMLMail(`Alertas na indicação da Aluna ${aluna.nome_completo}`, eMailToSend, html, null, eMailText);
		}
		return 'Salvou indicados com sucesso';
	} catch (error) {
		help.sentryError('Erro em saveIndicados', error);
		return error;
	}
}

/**
 * @description Saves the answers from both the indicados_questionarios (avaliador360pre or avaliador360pos)
 * @param {string} surveyName The name of the survey being answered (from questionario table), we use it to find the name of the column
 * @param {integer} indicadoID ID of the indicado this answer belongs to
 * @param {object} answer the formated answer
 * @returns {object|string} description of execution result
 */
async function saveAvaliacao360(surveyName, answer, indicadoID) {
	try {
		const columnName = { avaliador360pre: 'pre', avaliador360pos: 'pos' };
		const res = await DB.upsertIndicadosRespostas(indicadoID, columnName[surveyName], answer);
		if (res && res.id) return `Salvou ${surveyName} com sucesso!`;
		throw new help.MyError('Erro ao salvar avaliação 360', { res, indicadoID, columnName: columnName[surveyName], answer }); // eslint-disable-line object-curly-newline
	} catch (error) {
		help.sentryError('Erro em saveAvaliacao360', error);
		return error;
	}
}

/**
 * @description Saves the answers from both the alunos questionarios (sondagemPre or sondagemPos)
 * @param {string} surveyName The name of the survey being answered (from questionario table), we use it to find the name of the column
 * @param {integer} alunoID ID of the indicado this answer belongs to
 * @param {object} answer the formated answer
 * @returns {object|string} description of execution result
 */
async function saveSondagem(surveyName, answer, alunoID) {
	try {
		const columnName = { sondagemPre: 'pre', sondagemPos: 'pos' };
		const res = await DB.upsertAtividade(alunoID, columnName[surveyName], answer);
		if (res && res.id) return `Salvou ${surveyName} com sucesso!`;
		throw new help.MyError('Erro ao salvar sondagem', { res, alunoID, columnName: columnName[surveyName], answer }); // eslint-disable-line object-curly-newline
	} catch (error) {
		help.sentryError('Erro em saveSondagem', error);
		return error;
	}
}

/**
 * @description Saves avaliação do módulo
 * @param {string} surveyName The name of the survey being answered (from questionario table), we use it to find the name of the column
 * @param {integer} alunoID ID of the indicado this answer belongs to
 * @param {object} answer the formated answer
 * @returns {object|string} description of execution result
 */
async function saveAvaliacaoModulo(surveyName, answer, alunoID) {
	try {
		const columnName = { modulo1: 'avaliacao_modulo1', modulo2: 'avaliacao_modulo2', modulo3: 'avaliacao_modulo3' };
		const res = await DB.upsertAtividade(alunoID, columnName[surveyName], answer);
		if (res && res.id) return `Salvou ${surveyName} com sucesso!`;
		throw new help.MyError('Erro ao salvar avaliacão', { res, alunoID, columnName: columnName[surveyName], answer }); // eslint-disable-line object-curly-newline
	} catch (error) {
		help.sentryError('Erro em saveAvaliacaoModulo', error);
		return error;
	}
}


module.exports = {
	saveIndicados, saveAvaliacao360, saveSondagem, saveAvaliacaoModulo, handleAtividadeOne, sendMatricula, sendDonnaMail,
};
