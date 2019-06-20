const helper = require('./helper');
const smAPI = require('../sm_api');
const { sendTestMail } = require('./mailer');
const { eMail } = require('./flow');
const db = require('./DB_helper');
const chart = require('../simple_chart');

const surveysInfo = require('./sm_surveys');
const surveysMaps = require('./sm_maps');
const chartsMaps = require('./charts_maps');


async function separateIndicadosData(cpf) {
	const indicado = await db.getIndicadoRespostas(cpf);
	let newMap = chartsMaps.avaliacao360Pre;
	const commomKeys = ['avalias', 'exemplo', 'melhora'];
	const size = newMap.length / commomKeys.length;
	const data = []; // contains only the answers from pre

	for (let i = 1; i <= size; i++) {
		const aux = {};
		aux.titlePre = newMap.find(x => x.paramName === `${commomKeys[0]}${i}`); aux.titlePre = `Q${i}. ${aux.titlePre.questionName}`;
		commomKeys.forEach((element) => {
			aux[`${element}Pre`] = indicado.reduce((prev, cur) => `${prev} ${cur.pre && cur.pre[`${element}${i}`] ? `--${cur.pre[`${element}${i}`]}` : ''}`, '');
		});
		data.push(aux);
	}

	const result = []; // mixes pre and pos
	newMap = chartsMaps.avaliador360pos;
	commomKeys.pop(); // pos doesnt have "melhora"
	const posKeys = ['houve_evolucao', 'onde_evolucao'];

	for (let i = 1; i <= size; i++) {
		const aux = data[i - 1]; // getting aux from the previous array
		aux.titlePos = newMap.find(x => x.paramName === `${commomKeys[0]}${i}`); aux.titlePos = `Q${i}. ${aux.titlePos.questionName}`;
		commomKeys.forEach((element) => { // eslint-disable-line
			aux[`${element}Pos`] = indicado.reduce((prev, cur) => `${prev} ${cur.pos && cur.pos[`${element}${i}`] ? `--${cur.pos[`${element}${i}`]}` : ''}`, '');
		});
		commomKeys.forEach((element) => { // eslint-disable-line
			aux.houveEvolucao = indicado.reduce((prev, cur) => `${prev} ${cur.pos && cur.pos[posKeys[0]] ? `--${cur.pos[posKeys[0]]}` : ''}`, '');
			aux.ondeEvolucao = indicado.reduce((prev, cur) => `${prev} ${cur.pos && cur.pos[posKeys[1]] ? `--${cur.pos[posKeys[1]]}` : ''}`, '');
		});

		result.push(aux);
	}

	return result;
}

async function buildAlunoChart(cpf) {
	const aluna = await db.getAlunoRespostas(cpf);
	const data = {};
	if (aluna && aluna.pre && aluna.pos) {
		chartsMaps.autoAvaliacao.forEach(async (element) => { // this map contains only the necessary answers
			if (aluna.pre[element.paramName] && aluna.pos[element.paramName]) { // build obj with param_name and the number variation
				data[element.questionName] = helper.getPercentageChange(aluna.pre[element.paramName], aluna.pos[element.paramName]);
			}
		});
	}

	console.log(data);

	if (data && Object.keys(data) && Object.keys(data).length > 0) {
		await chart.createChart(Object.keys(data), Object.values(data), cpf, `Resultado auto-avaliação ${aluna.nome}`);
	}
}

// buildAlunoChart(12345678911);
// separateIndicadosData('12345678911');

// after a payement happens we send an e-mail to the buyer with the matricula/pre-cadastro form
async function sendMatricula(productID, buyerEmail) {
	try {
		const spreadsheet = await helper.reloadSpreadSheet(1, 6); // console.log('spreadsheet', spreadsheet); // load spreadsheet
		const column = await spreadsheet.find(x => x.pagseguroId.toString() === productID.toString()); console.log('column', column); // get same product id (we want to know the "turma")
		const newUrl = surveysInfo.preCadastro.link.replace('TURMARESPOSTA', column.turma); // pass turma as a custom_parameter
		const newText = eMail.preCadastro.texto.replace('<TURMA>', column.turma).replace('<LINK>', newUrl); // prepare mail text
		await sendTestMail(eMail.preCadastro.assunto, newText, buyerEmail);
	} catch (error) {
		console.log('Erro em sendMatricula', error); helper.Sentry.captureMessage('Erro em sendMatricula');
	}
}

async function addCustomParametersToAnswer(answers, parameters) {
	const result = answers;
	if (parameters && Object.keys(parameters)) {
		Object.keys(parameters).forEach(async (element) => {
			result[element] = parameters[element];
		});
	}

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
				result.push({ id: element2.row_id, text: element2.text });
			} else if (element2.row_id && element2.choice_id && !element2.text) {
				result.push({ id: element2.row_id, choice_id: element2.choice_id });
			} else if (element.id && element2.text) { // element.id: questions that have only one answer so the id belongs to the question, not the subquestion
				result.push({ id: element.id, text: element2.text });
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
				const desiredQuestion = await map.find(x => x.questionID.toString() === question.id.toString()); // check if this question is one of the question we're looking for
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
	const findDropdown = map.filter(x => x.dropdown && x.dropdown.length > 0);

	if (findDropdown) { // check if we have an answer that needs replacement (choice.id isnt the actual answer)
		const survey = await smAPI.getSurveyDetails(surveyID); // load survey and separate the questions (load the details noew because we know we will need them)

		for (let i = 0; i < survey.pages.length; i++) {
			const questionDetails = survey.pages[i].questions;
			await findDropdown.forEach((element) => { // for each map element we should replace
				if (result[element.paramName] && result[element.paramName].slice(0, 8) !== '<outros>') { // check if the answers array actually has that answer and it's not an "Others" option
					const findQuestion = questionDetails.find(x => x.id.toString() === element.dropdown); // element.dropdown -> the ud
					if (findQuestion && findQuestion.answers && findQuestion.answers.cols && findQuestion.answers.cols[0] && findQuestion.answers.cols[0].choices) {
						// find the answer that has the same choice_id as the answer we have salved
						const findAnswer = findQuestion.answers.cols[0].choices.find(x => x.id.toString() === result[element.paramName].toString());
						result[element.paramName] = findAnswer.text; // replace the choice_id saved with the actual text of the option
					} else if (findQuestion && findQuestion.answers && findQuestion.answers.choices) {
						const findAnswer = findQuestion.answers.choices.find(x => x.id.toString() === result[element.paramName].toString());
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

async function handleAtividade(response, column) {
	response.custom_variables = { turma: 'T7-SP', cpf: '12345678911' };
	const aluno = await db.getAluno(response.custom_variables.cpf);
	if (aluno) {
		await db.updateAtividade(aluno.id, column, true);
	}
}


async function handlePreCadastro(response) {
	// custom_variables should only have turma and/or cpf, the rest we have to get from the answers
	response.custom_variables = { turma: 'T7-SP', cpf: '12345678911' };
	/* getting answer */
	let answers = await getSpecificAnswers(surveysMaps.preCadastro, response.pages);
	answers = await replaceChoiceId(answers, surveysMaps.preCadastro, response.survey_id);
	answers = await addCustomParametersToAnswer(answers, response.custom_variables);
	if (answers.cpf) { answers.cpf = await answers.cpf.replace(/[_.,-]/g, '');	}
	console.log('answers', answers);
	/* db */
	const newUserID = await db.upsertAluno(answers.nome, answers.cpf, answers.turma, answers.email);
	if (newUserID) {
		await db.upsertPrePos(newUserID, JSON.stringify(answers), 'pre');
	}
	/* e-mail */
	const newText = eMail.depoisMatricula.texto.replace('<NOME>', answers.nome); // prepare mail text
	await sendTestMail(eMail.depoisMatricula.assunto, newText, answers.email);
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
		aux[elementos[Object.keys(aux).length]] = element.text || '';
		index += 1;
	});

	if (Object.keys(aux)) { result.push(aux); }

	return result;
}

async function sendMailToIndicados(indicados, aluna) {
	const text = `Olá. Você foi indicado por ${aluna.nome} para a avaliação. Responda abaixo:\n `;
	for (let i = 0; i < indicados.length; i++) {
		const newLink = `${surveysInfo.avaliador360pre.link.replace('IDRESPOSTA', indicados[i].id)}`;
		await sendTestMail(`${aluna.nome} te indicou!`, text + newLink, indicados[i].email);
	}
}

async function handleIndicacao(response) {
	// console.log('responses', JSON.stringify(response, null, 2));
	response.custom_variables = { turma: 'T7-SP', cpf: '12345678911' };

	let answers = '';
	response.pages.forEach(async (element) => { // look for the question with the e-mails (the map has only this question id)
		answers = element.questions.find(x => x.id === surveysMaps.indicacao360[0].questionID) || [];
	});

	const indicacao = await separateAnswer(answers.answers, ['nome', 'email', 'tele']) || [];

	// saving the answer with the user
	const aluna = await db.getAluno(response.custom_variables.cpf);
	if (aluna && aluna.id) {
		await db.updateAtividade(aluna.id, 'atividade_indicacao', JSON.stringify(answers.answers));
	}

	// saving each avaliador, if theres an e-mail
	const indicacaoIds = [];
	for (let i = 0; i < indicacao.length; i++) {
		if (indicacao[i].email) {
			const newAvaliador = await db.insertIndicacao(aluna.id, indicacao[i]);
			if (newAvaliador) { // saving the ids to create the link to send in the e-mail
				indicacaoIds.push(newAvaliador);
			}
		}
	}

	await sendMailToIndicados(indicacaoIds, aluna);

	/* saving familiares */
	answers = '';
	response.pages.forEach(async (element) => { // look for the question with the e-mails (the map has only this question id)
		answers = element.questions.find(x => x.id === surveysMaps.indicacao360[1].questionID) || [];
	});

	const familiar = await separateAnswer(answers.answers, ['nome', 'relacao', 'email', 'tele']) || [];
	for (let i = 0; i < familiar.length; i++) {
		if (familiar[i].email) {
			await db.insertFamiliar(aluna.id, familiar[i]);
		}
	}
}

async function handlePosAvaliacao(response) {
	response.custom_variables = { turma: 'T7-SP', cpf: '12345678911' };

	let answers = await getSpecificAnswers(surveysMaps.posAvaliacao, response.pages);
	answers = await replaceChoiceId(answers, surveysMaps.posAvaliacao, response.survey_id);
	answers = await addCustomParametersToAnswer(answers, response.custom_variables);
	/* db */
	const aluna = await db.getAluno(response.custom_variables.cpf);
	if (aluna) {
		await db.upsertPrePos(aluna.id, JSON.stringify(answers), 'pos');
	}
}

async function handleAvaliador(response, column, map) {
	response.custom_variables = { id: '1' };

	let answers = await getSpecificAnswers(map, response.pages);
	answers = await replaceChoiceId(answers, map, response.survey_id);
	answers = await addCustomParametersToAnswer(answers, response.custom_variables);

	await db.upsertPrePos360(answers.id, JSON.stringify(answers), column);
}

// what to do with the form that was just answered
async function newSurveyResponse(event) {
	const responses = await smAPI.getResponseWithAnswers(event.filter_id, event.object_id); console.log('responses', JSON.stringify(responses, null, 2)); // get details of the event
	switch (responses.survey_id) { // which survey was answered?
	case surveysInfo.preCadastro.id:
		await handlePreCadastro(responses);
		break;
	case surveysInfo.posAvaliacao.id:
		await handlePosAvaliacao(responses);
		break;
	case surveysInfo.atividade1.id:
		await handleAtividade(responses, 'atividade_1');
		break;
	case surveysInfo.atividade2.id:
		await handleAtividade(responses, 'atividade_2');
		break;
	case surveysInfo.module1.id:
		await handleAtividade(responses, 'atividade_modulo1');
		break;
	case surveysInfo.module2.id:
		await handleAtividade(responses, 'atividade_modulo2');
		break;
	case surveysInfo.module3.id:
		await handleAtividade(responses, 'atividade_modulo3');
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
		break;
	}
}

// handleAvaliador(mock, 'pos', surveysMaps.avaliacao360Pos);


module.exports = {
	sendMatricula, newSurveyResponse, buildAlunoChart, separateIndicadosData,
};
