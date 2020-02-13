const fs = require('fs');
const { sentryError } = require('./helper');
const { getIndicacaoErrorText } = require('./helper');
const { getSameContatoEmailErrorText } = require('./helper');
const matriculaLog = require('../server/models').matricula_mail_log;
const notificationQueue = require('../server/models').notification_queue;
const smAPI = require('../sm_api');
const mailer = require('./mailer');
const { eMail } = require('./flow');
const db = require('./DB_helper');
const addQueue = require('./notificationAddQueue');
const { postRecipient } = require('../chatbot_api');
const { postRecipientLabelCPF } = require('../chatbot_api');
const { getChatbotData } = require('../chatbot_api');
const surveysInfo = require('./sm_surveys');
const { surveysMaps } = require('./sm_maps');
const { getMailAdmin } = require('./admin_menu/warn_admin');

// Add new aluna as new recipient in the assistente. In this case, the recipient doesn't need an fb_id, the cpf doubles as a key
async function sendAlunaToAssistente(name, email, cpf, turma) {
	const assistenteData = await getChatbotData(process.env.PAGE_ID);
	await postRecipient(assistenteData.user_id, { name, email, cpf });
	await postRecipientLabelCPF(assistenteData.user_id, cpf, turma);
}

// after a payement happens we send an e-mail to the buyer with the matricula/atividade 1 form
async function sendMatricula(turmaName, pagamentoID, buyerEmail, cpf) {
	try {
		let { link } = surveysInfo.atividade1;
		if (!pagamentoID) { link = link.replace('&pgid=PSIDRESPOSTA', ''); }
		if (cpf) { link += '&cpf=CPFRESPOSTA'; }

		let html = await fs.readFileSync(`${process.cwd()}/mail_template/ELAS_Matricula.html`, 'utf-8'); // prepare the e-mail
		link = link.replace(/TURMARESPOSTA/g, turmaName);
		link = link.replace(/PSIDRESPOSTA/g, pagamentoID);
		link = link.replace(/CPFRESPOSTA/g, cpf);

		html = await html.replace(/<link_atividade>/g, link); // add link to mail template
		const e = await mailer.sendHTMLMail(eMail.atividade1.assunto, buyerEmail, html);
		await matriculaLog.create({
			sentTo: buyerEmail, sentAt: new Date(), atividadeLink: link, error: e && e.stack ? e.stack : e,
		}).then((res) => res).catch((err) => sentryError('Erro em matriculaLog.create', err));
	} catch (error) { sentryError('Erro sendMatricula', error); }
}

async function sendMissingMatriculas() { // eslint-disable-line no-unused-vars
	const alunas = await db.getMissingCadastro();
	for (let i = 0; i < alunas.length; i++) {
		const e = alunas[i];
		await sendMatricula(e.turma_nome, e.pagamento_id, e.email, e.cpf);
	}
}

async function helpAddQueue(alunoID, turmaID) {
	const notificacoes = await notificationQueue.findAll({ where: { aluno_id: alunoID, sent_at: null, error: null }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do notificationQueue', err));
	if (!notificacoes || notificacoes.length === 0) {
		await addQueue.addNewNotificationAlunas(alunoID, turmaID);
	}
}

async function addCustomParametersToAnswer(answers, parameters) {
	const result = answers;
	if (parameters && Object.keys(parameters)) {
		Object.keys(parameters).forEach(async (element) => {
			result[element] = parameters[element];
		});
	}

	result.answer_date = new Date();

	return result;
}

// gets the answer from the survey response object
async function getAnswer(answers) {
	let result = '';
	if (answers.other_id) { // multiple choice (other + description)
		// const aux = {};	aux[answers[0].other_id] = `<outros>${answers[0].text}`;
		result = `<outros>${answers.text}`; // add <outros> to signal user choosing outros option
	} else if (answers.text) { // text/comment box
		result = answers.text;
	} else if (answers.choice_id) { // multiple choice (regular) / dropdown
		result = answers.choice_id;
	}	return result;
}


async function formatAnswers(question) {
	const result = [];
	const answers = question;

	answers.forEach((element) => {
		element.answers.forEach((element2) => {
			if (element2.row_id && element2.text && !element2.choice_id) {
				result.push({ id: element2.row_id, text: element2.text.trim() });
			} else if (element2.row_id && element2.choice_id && !element2.text) {
				result.push({ id: element2.row_id, choice_id: element2.choice_id });
			} else if (element.id && element2.text) { // element.id: questions that have only one answer so the id belongs to the question, not the subquestion
				result.push({ id: element.id, text: element2.text.trim() });
			} else if (element.id && element2.choice_id) {
				result.push({ id: element.id, choice_id: element2.choice_id });
			} else if (element.id && element2.other_id) {
				result.push({ id: element.id, other_id: element2.other_id });
			}
		});
	});

	// console.log('result', JSON.stringify(result, null, 2));
	return result;
}

// uses the map to find the answers on the survey response
async function getSpecificAnswers(map, responses) {
	const result = {};

	for (let i = 0; i < responses.length; i++) { // iterate through the pages in the responses
		const page = responses[i]; // get page
		if (page.questions) { // check if the page has any questions
			page.questions = await formatAnswers(page.questions);
			for (let j = 0; j < page.questions.length; j++) { // iterate through the questions
				const question = page.questions[j]; // get question
				const desiredQuestion = await map.find((x) => x.questionID.toString() === question.id.toString()); // check if this question is one of the question we're looking for
				if (desiredQuestion) { // check if we found a desirable question
					const theAnswer = await getAnswer(question); // get the actual answer from the question
					if (theAnswer) { // check if we did find an answer
						result[desiredQuestion.paramName] = theAnswer; // create an aux obj with the name of the param and the answer found
					}
				}
			}
		}
	}

	return result;
}

async function replaceChoiceId(answers, map, surveyID) {
	const result = answers;
	const findDropdown = map.filter((x) => x.dropdown && x.dropdown.length > 0);

	if (findDropdown) { // check if we have an answer that needs replacement (choice.id isnt the actual answer)
		const survey = await smAPI.getSurveyDetails(surveyID); // load survey and separate the questions (load the details noew because we know we will need them)

		for (let i = 0; i < survey.pages.length; i++) {
			const questionDetails = survey.pages[i].questions;
			await findDropdown.forEach((element) => { // for each map element we should replace
				if (result[element.paramName] && result[element.paramName].slice(0, 8) !== '<outros>') { // check if the answers array actually has that answer and it's not an "Others" option
					const findQuestion = questionDetails.find((x) => x.id.toString() === element.dropdown); // element.dropdown -> the ud
					if (findQuestion && findQuestion.answers && findQuestion.answers.cols && findQuestion.answers.cols[0] && findQuestion.answers.cols[0].choices) {
						// find the answer that has the same choice_id as the answer we have salved
						const findAnswer = findQuestion.answers.cols[0].choices.find((x) => x.id.toString() === result[element.paramName].toString());
						result[element.paramName] = findAnswer.text; // replace the choice_id saved with the actual text of the option
					} else if (findQuestion && findQuestion.answers && findQuestion.answers.choices) {
						const findAnswer = findQuestion.answers.choices.find((x) => x.id.toString() === result[element.paramName].toString());
						result[element.paramName] = findAnswer.text; // replace the choice_id saved with the actual text of the option
					}
				}
			});
		}
	}

	Object.keys(result).forEach((element) => {
		if (result[element].includes('<outros>')) {
			result[element] = result[element].replace('<outros>', '');
		}
	});

	return result;
}

async function buildPseudoMap(surveyID) {
	const details = await smAPI.getSurveyDetails(surveyID);
	const results = [];
	details.pages.forEach((page) => {
		page.questions.forEach((question) => {
			if (question.answers && question.answers.rows) {
				question.answers.rows.forEach((answer) => {
					results.push({ questionID: answer.id, dropdown: question.id, paramName: answer.text });
				});
			} else if (question.headings[0] && question.headings[0].heading) {
				results.push({ questionID: question.id, paramName: question.headings[0].heading });
			}
		});
	});

	return results;
}

async function handleAvaliacao(response, column) {
	const map = await buildPseudoMap(response.survey_id);
	let answers = await getSpecificAnswers(map, response.pages);
	answers = await replaceChoiceId(answers, map, response.survey_id);
	answers = await addCustomParametersToAnswer(answers, response.custom_variables);
	const aluno = await db.getAluno(response.custom_variables.cpf);
	if (aluno) {
		await db.updateAtividade(aluno.id, column, answers);
	}
}

async function handleAtividadeOne(response) {
	try {
		// response.custom_variables = { turma: 'T7-SP', cpf: '99999999990', pgid: '17' };
		// console.log('custom_variables', response.custom_variables);
		let sameContatoEmail = false;
		let answers = await getSpecificAnswers(surveysMaps.atividade1, response.pages);
		answers = await replaceChoiceId(answers, surveysMaps.atividade1, response.survey_id);
		answers = await addCustomParametersToAnswer(answers, response.custom_variables);
		if (answers.cpf) { answers.cpf = await answers.cpf.replace(/[_.,-]/g, ''); }
		if (response.custom_variables && response.custom_variables.cpf) { answers.cpf = response.custom_variables.cpf; } // cpf as a parameter overwrites cpf as an answer
		const cadastroStatus = await db.getAlunaRespostaCadastro(answers.cpf); // check if aluna has answered this questionario before
		if (cadastroStatus) { // aluna can only answer this questionario once
			sentryError('Aluna respondeu o cadastro novamente', { answers });
		} else {
			answers.added_by_admin = false; // user wasnt added by the admins
			answers.turma_id = await db.getTurmaID(answers.turma);

			const newUser = await db.upsertAlunoCadastro(answers);
			if (newUser && newUser.id) { // if everything went right we update a few things
				await db.updateAtividade(newUser.id, 'atividade_1', answers);
				if (answers.pgid) await db.updateAlunoOnPagamento(answers.pgid, newUser.id);
				await helpAddQueue(newUser.id, newUser.turma_id);
				await sendAlunaToAssistente(newUser.nome_completo, newUser.email, newUser.cpf, answers.turma);
				if (newUser.email === newUser.contato_emergencia_email) sameContatoEmail = true;
			} else {
				sentryError('Erro no salvamento de cadastro', { answers, newUser });
			}

			/* sending "Apresentação" mail */
			let html = await fs.readFileSync(`${process.cwd()}/mail_template/ELAS_Apresentar_Donna.html`, 'utf-8');
			html = await html.replace('[nome]', answers.nome_completo); // add nome to mail template
			html = await html.replace(/<link_donna>/g, process.env.LINK_DONNA); // add chatbot link to mail template
			await mailer.sendHTMLMail(eMail.depoisMatricula.assunto, answers.email, html);

			if (sameContatoEmail) {
				const eMailToSend = await getMailAdmin(answers.turma);
				const eMailText = await getSameContatoEmailErrorText(newUser);
				let html2 = await fs.readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
				html2 = await html2.replace('[CONTEUDO_MAIL]', eMailText);
				await mailer.sendHTMLMail(`Alerta no cadastro da Aluna ${newUser.nome_completo}`, eMailToSend, html2);
			}
		}
	} catch (error) {	sentryError('Erro em handleAtividadeOne', error); }
}

async function separateAnswer(respostas, elementos) {
	// separate the array of answers into and array of objects with the desired elements
	const result = [];
	let index = 0;
	let aux = {};
	respostas.forEach(async (element) => {
		if (index && index % elementos.length === 0) {
			result.push(aux);
			aux = {};
		}
		// use the keys of the aux obj to find the new key for the aux
		aux[elementos[Object.keys(aux).length]] = element;
		index += 1;
	});

	if (Object.keys(aux)) { result.push(aux); }

	return result;
}

async function handleIndicacao(response) {
	const errors = [];
	const baseAnswers = await formatAnswers(response.pages[0].questions);
	const aluna = await db.getAluno(response.custom_variables.cpf);
	aluna.turma = response.custom_variables.turma;

	let indicados = {}; // could just as well be an array with the answers
	await surveysMaps.indicacao360.forEach(async (element) => { // getting the answers for the indicados
		const aux = baseAnswers.find((x) => x.id === element.questionID);
		indicados[element.paramName] = aux && aux.text ? aux.text : '';
	});

	// formatting the answers
	const indicacao = await separateAnswer(Object.values(indicados), ['nome', 'email', 'tele']) || [];
	// saving each avaliador, if theres an e-mail
	for (let i = 0; i < indicacao.length; i++) {
		if (indicacao[i].nome || indicacao[i].email || indicacao[i].tele) { // check if indicado has anything fulfilled
			if (!indicacao[i].email) errors.push({ id: 1, indicado: indicacao[i] });
			if (indicacao[i].email && (indicacao[i].email === aluna.email)) errors.push({ id: 2, indicado: indicacao[i] });
			await db.insertIndicacao(aluna.id, indicacao[i], false);
		}
	}

	// getting the answers for the familiares
	indicados = {}; // cleaning up
	await surveysMaps.indicacao360_familiares.forEach(async (element) => {
		const aux = baseAnswers.find((x) => x.id === element.questionID);
		indicados[element.paramName] = aux && aux.text ? aux.text : '';
	});

	// saving each familiar
	const familiar = await separateAnswer(Object.values(indicados), ['nome', 'relacao', 'email', 'tele']) || [];
	for (let i = 0; i < familiar.length; i++) {
		if (familiar[i].nome || familiar[i].relacao || familiar[i].email || familiar[i].tele) { // check if amiliar has anything fulfilled
			if (!familiar[i].email) errors.push({ id: 3, indicado: familiar[i] });
			if (familiar[i].email && (familiar[i].email === aluna.email)) errors.push({ id: 4, indicado: familiar[i] });
			await db.insertIndicacao(aluna.id, familiar[i], true);
		}
	}

	await addQueue.addNewNotificationIndicados(aluna.id, aluna.turma_id);

	// joining indicados and saving answer
	let answers = indicacao.concat(familiar);
	answers = await addCustomParametersToAnswer(answers, response.custom_variables);

	await db.updateAtividade(aluna.id, 'atividade_indicacao', answers);
	if (errors && errors.length > 0) {
		const eMailToSend = await getMailAdmin(aluna.turma);
		const eMailText = await getIndicacaoErrorText(errors, aluna);
		let html = await fs.readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
		html = await html.replace('[CONTEUDO_MAIL]', eMailText);
		await mailer.sendHTMLMail(`Alertas na indicação da Aluna ${aluna.nome}`, eMailToSend, html);
	}
}

async function handleSondagem(response, column, map) {
	// console.log('custom_variables', response.custom_variables);

	let answers = await getSpecificAnswers(map, response.pages);
	answers = await replaceChoiceId(answers, map, response.survey_id);
	answers = await addCustomParametersToAnswer(answers, response.custom_variables);

	const aluna = await db.getAluno(response.custom_variables.cpf);
	if (aluna) {
		await db.upsertPrePos(aluna.id, JSON.stringify(answers), column);
	}
}

async function handleAvaliador(response, column, map) {
	// response.custom_variables = { indicaid: '1' };
	// console.log('custom_variables', response.custom_variables);

	let answers = await getSpecificAnswers(map, response.pages);
	answers = await replaceChoiceId(answers, map, response.survey_id);
	answers = await addCustomParametersToAnswer(answers, response.custom_variables);
	await db.upsertPrePos360(answers.indicaid, JSON.stringify(answers), column);
}

// what to do with the form that was just answered
async function newSurveyResponse(event) {
	console.log('newSurveyResponse', JSON.stringify(event, null, 2));
	const responses = await smAPI.getResponseWithAnswers(event.filter_id, event.object_id);
	console.log('responses', JSON.stringify(responses, null, 2)); // get details of the event
	switch (responses.survey_id) { // which survey was answered?
	case surveysInfo.sondagemPre.id:
		await handleSondagem(responses, 'pre', surveysMaps.sondagemPre);
		break;
	case surveysInfo.sondagemPos.id:
		await handleSondagem(responses, 'pos', surveysMaps.sondagemPos);
		break;
	case surveysInfo.atividade1.id:
		await handleAtividadeOne(responses);
		break;
	case surveysInfo.module1.id:
		await handleAvaliacao(responses, 'avaliacao_modulo1');
		break;
	case surveysInfo.module2.id:
		await handleAvaliacao(responses, 'avaliacao_modulo2');
		break;
	case surveysInfo.module3.id:
		await handleAvaliacao(responses, 'avaliacao_modulo3');
		break;
	case surveysInfo.indicacao360.id:
		await handleIndicacao(responses);
		break;
	case surveysInfo.avaliador360pre.id:
		await handleAvaliador(responses, 'pre', surveysMaps.avaliacao360Pre);
		break;
	case surveysInfo.avaliador360pos.id:
		await handleAvaliador(responses, 'pos', surveysMaps.avaliacao360Pos);
		break;
	default:
		await sentryError(`Received unknown survey ID after answer! -> ${responses.survey_id}`, responses);
		break;
	}
}

module.exports = {
	sendMatricula, newSurveyResponse, sendAlunaToAssistente, helpAddQueue,
};
