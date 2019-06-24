const fs = require('fs');
const helper = require('./helper');
const smAPI = require('../sm_api');
const { sendTestMail } = require('./mailer');
const { eMail } = require('./flow');
const db = require('./DB_helper');
const chart = require('../simple_chart');


const surveysInfo = require('./sm_surveys');
const surveysMaps = require('./sm_maps');
const chartsMaps = require('./charts_maps');


async function buildAlunoChart(cpf) {
	const aluna = await db.getAlunoRespostas(cpf);
	const data = {};

	if (aluna && aluna.pre && aluna.pos) {
		chartsMaps.sondagem.forEach(async (element) => { // this map contains only the necessary answers
			if (aluna.pre[element.paramName] && aluna.pos[element.paramName]) { // build obj with param_name and the number variation
				data[element.questionName] = helper.getPercentageChange(aluna.pre[element.paramName], aluna.pos[element.paramName]);
			}
		});
	}

	if (data && Object.keys(data) && Object.keys(data).length > 0) {
		await chart.createChart(Object.keys(data), Object.values(data), cpf, `Resultado auto-avaliação ${aluna.nome}`);
	}
}

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

async function buildIndicadoChart(cpf) {
	const data = await separateIndicadosData(cpf);
	console.log(data);


	const styleDiv = 'font-size:10pt;margin-left:1.5em;margin-right:1.5em;margin-bottom:0.5em;margin-top:2.0em';
	let html = `<p style="${styleDiv}"><h1>Resultados</h1></p>`;
	html += `<table style="width:100% border:1px solid black " border=1>
 	<tr> <th>Questão Pré</th> <th>Avaliação Pré</th> <th>Exemplo Pré</th> <th>Oportunidade Pré</th> `;
	data.forEach((element) => {
		html += `<tr> <td>${element.titlePre}</td> <td>${element.avaliasPre}</td> 
				<td>${element.exemploPre}</td> <td>${element.melhoraPre}</td> </tr>`;
	});
	html += '</table><br><br>';
	html += `<table style="width:100% border:1px solid black " border=1>
 	<tr> <th>Questão Pós</th> <th>Avaliação Pós</th>`;
	data.forEach((element) => {
		html += `<tr> <td>${element.titlePos}</td> <td>${element.avaliasPos}</td> </tr>`;
	});
	html += '</table>';

	html += `<p style="${styleDiv}"><h5>Houve evolução?</h5></p> <div> ${data[0].houveEvolucao} </div>`;
	html += `<p style="${styleDiv}"><h5>Onde houve evolução?</h5></p> <div> ${data[0].ondeEvolucao} </div>`;

	helper.pdf.create(html).toStream((err, stream) => {
		stream.pipe(fs.createWriteStream(`./${cpf}_360Results.pdf`));
		console.log('Success!', `./${cpf}_360Results.pdf`, 'was created!');
	});
}

// buildAlunoChart(12345678911);
// buildIndicadoChart('12345678911');

// after a payement happens we send an e-mail to the buyer with the matricula/atividade 1 form
async function sendMatricula(productID, buyerEmail) {
	try {
		const spreadsheet = await helper.reloadSpreadSheet(1, 6); // console.log('spreadsheet', spreadsheet); // load spreadsheet
		const column = await spreadsheet.find(x => x.pagseguroId.toString() === productID.toString()); console.log('column', column); // get same product id (we want to know the "turma")
		const newUrl = surveysInfo.atividade1.link.replace('TURMARESPOSTA', column.turma); // pass turma as a custom_parameter
		const newText = eMail.atividade1.texto.replace('<TURMA>', column.turma).replace('<LINK>', newUrl); // prepare mail text
		await sendTestMail(eMail.atividade1.assunto, newText, buyerEmail);
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

async function handleAtividadeOne(response) {
	response.custom_variables = { turma: 'T7-SP' };
	let answers = await getSpecificAnswers(surveysMaps.atividade1, response.pages);
	answers = await replaceChoiceId(answers, surveysMaps.atividade1, response.survey_id);
	answers = await addCustomParametersToAnswer(answers, response.custom_variables);
	if (answers.cpf) { answers.cpf = await answers.cpf.replace(/[_.,-]/g, ''); }

	const newUserID = await db.upsertAluno(answers.nome, answers.cpf, answers.turma, answers.email);
	if (newUserID) {
		await db.updateAtividade(newUserID, 'atividade_1', true);
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
		aux[elementos[Object.keys(aux).length]] = element;
		index += 1;
	});

	if (Object.keys(aux)) { result.push(aux); }

	return result;
}

// async function sendMailToIndicados(indicados, aluna) {
// 	const text = `Olá. Você foi indicado por ${aluna.nome} para a avaliação. Responda abaixo:\n `;
// 	for (let i = 0; i < indicados.length; i++) {
// 		const newLink = `${surveysInfo.avaliador360pre.link.replace('IDRESPOSTA', indicados[i].id)}`;
// 		await sendTestMail(`${aluna.nome} te indicou!`, text + newLink, indicados[i].email);
// 	}
// }

async function handleIndicacao(response) {
	response.custom_variables = { turma: 'T7-SP', cpf: '12345678911' };

	const baseAnswers = await formatAnswers(response.pages[0].questions);
	const aluna = await db.getAluno(response.custom_variables.cpf);

	let indicados = {}; // could just as well be an array with the answers
	await surveysMaps.indicacao360.forEach(async (element) => { // getting the answers for the indicados
		const aux = baseAnswers.find(x => x.id === element.questionID);
		indicados[element.paramName] = aux && aux.text ? aux.text : '';
	});

	// formating the answers
	const indicacao = await separateAnswer(Object.values(indicados), ['nome', 'email', 'tele']) || [];
	// saving each avaliador, if theres an e-mail
	for (let i = 0; i < indicacao.length; i++) {
		if (indicacao[i].email) { await db.insertIndicacao(aluna.id, indicacao[i], false); }
	}

	// getting the answers for the familiares
	indicados = {}; // cleaning up
	await surveysMaps.indicacao360_familiares.forEach(async (element) => {
		const aux = baseAnswers.find(x => x.id === element.questionID);
		indicados[element.paramName] = aux && aux.text ? aux.text : '';
	});

	// saving each familair, if theres an e-mail
	const familiar = await separateAnswer(Object.values(indicados), ['nome', 'relacao', 'email', 'tele']) || [];
	for (let i = 0; i < familiar.length; i++) {
		if (familiar[i].email) { await db.insertIndicacao(aluna.id, familiar[i], true);	}
	}

	// joining indicados and saving answer
	let answers = indicacao.concat(familiar);
	answers = await addCustomParametersToAnswer(answers, response.custom_variables);

	await db.updateAtividade(aluna.id, 'atividade_indicacao', JSON.stringify(answers));
}

async function handleSondagem(response, column, map) {
	response.custom_variables = { turma: 'T7-SP', cpf: '12345678911' };

	let answers = await getSpecificAnswers(map, response.pages);
	answers = await replaceChoiceId(answers, map, response.survey_id);
	answers = await addCustomParametersToAnswer(answers, response.custom_variables);
	/* db */

	const aluna = await db.getAluno(response.custom_variables.cpf);
	if (aluna) {
		await db.upsertPrePos(aluna.id, JSON.stringify(answers), column);
	}
}

async function handleAvaliador(response, column, map) {
	response.custom_variables = { id: '2' };

	let answers = await getSpecificAnswers(map, response.pages);
	answers = await replaceChoiceId(answers, map, response.survey_id);
	answers = await addCustomParametersToAnswer(answers, response.custom_variables);
	await db.upsertPrePos360(answers.id, JSON.stringify(answers), column);
}

console.log(surveysInfo);

// what to do with the form that was just answered
async function newSurveyResponse(event) {
	const responses = await smAPI.getResponseWithAnswers(event.filter_id, event.object_id); console.log('responses', JSON.stringify(responses, null, 2)); // get details of the event
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

module.exports = {
	sendMatricula, newSurveyResponse, buildAlunoChart, separateIndicadosData, buildIndicadoChart,
};
