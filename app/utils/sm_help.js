const helper = require('./helper');
const smAPI = require('../sm_api');
const { sendTestMail } = require('./mailer');
const { eMail } = require('./flow');
const db = require('./DB_helper');

const surveysInfo = require('./sm_surveys');
const surveysMaps = require('./sm_maps');

// after a payement happens we send an e-mail to the buyer with the matricula/pre-cadastro form
async function sendMatricula(productID, buyerEmail) {
	try {
		const spreadsheet = await helper.reloadSpreadSheet(1, 6); // console.log('spreadsheet', spreadsheet); // load spreadsheet
		const column = await spreadsheet.find(x => x.pagseguroId.toString() === productID.toString()); console.log('column', column); // get same product id (we want to know the "turma")
		const newUrl = surveysInfo.atividade1.link.replace('TURMARESPOSTA', column.turma); // pass turma as a custom_parameter
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
		await db.upsertPreCadastro(newUserID, JSON.stringify(answers));
	}
	/* e-mail */
	const newText = eMail.depoisMatricula.texto.replace('<NOME>', answers.nome); // prepare mail text
	await sendTestMail(eMail.depoisMatricula.assunto, newText, answers.email);
}

// what to do with the form that was just answered
async function newSurveyResponse(event) {
	const responses = await smAPI.getResponseWithAnswers(event.filter_id, event.object_id); console.log('responses', JSON.stringify(responses, null, 2)); // get details of the event
	switch (responses.survey_id) { // which survey was answered?
	case surveysInfo.preCadastro.id:
		await handlePreCadastro(responses);
		break;
	case surveysInfo.atividade1.id:
		break;
	default:
		break;
	}
}

const mock = {
	total_time: 30,
	href: 'https://api.surveymonkey.com/v3/surveys/179374831/responses/10793899087',
	custom_variables: {},
	ip_address: '201.0.206.53',
	id: '10793899087',
	logic_path: {},
	date_modified: '2019-06-12T21:13:59+00:00',
	response_status: 'completed',
	custom_value: '',
	analyze_url: 'https://www.surveymonkey.com/analyze/browse/fyjBhnHPiucmNbYV_2BMqK4W7ghAr3JnGmpqGTYR7HtcY_3D?respondent_id=10793899087',
	pages: [
		{
			id: '80239087',
			questions: [
				{
					id: '295014491',
					answers: [
						{
							text: 'jordan',
							row_id: '1970468009',
						},
						{
							text: 'aaaaa',
							row_id: '1970468010',
						},
						{
							text: 'cccccc',
							row_id: '1970468011',
						},
						{
							text: 'jordan@appcivico.com',
							row_id: '1970468012',
						},
						{
							text: 'asdasd',
							row_id: '1970468013',
						},
					],
				},
				{
					id: '295014494',
					answers: [
						{
							choice_id: '1970468037',
						},
					],
				},
				{
					id: '295014492',
					answers: [
						{
							col_id: '1970468020',
							choice_id: '1970468024',
							row_id: '1970468034',
						},
						{
							col_id: '1970468020',
							choice_id: '1970468026',
							row_id: '1970468035',
						},
						{
							col_id: '1970468020',
							choice_id: '1970468024',
							row_id: '1970468017',
						},
					],
				},
				{
					id: '295014493',
					answers: [
						{
							text: 'Quero essa',
						},
					],
				},
				{
					id: '295014495',
					answers: [
						{
							choice_id: '1970468048',
						},
					],
				},
			],
		},
	],
	page_path: [],
	recipient_id: '',
	collector_id: '237487256',
	date_created: '2019-06-12T21:13:29+00:00',
	survey_id: '179374831',
	collection_mode: 'default',
	edit_url: 'https://www.surveymonkey.com/r/?sm=MaBiqL2yANgPLuUM3urZX_2BHLvH1cNLj7gfR6ZlY9iYaW3xRcQKk3ItdOvzU0BSX8',
	metadata: {
		respondent: {
			user_agent: {
				type: 'number',
				value: 8980151,
			},
			language: {
				type: 'string',
				value: 'pt_BR',
			},
		},
	},
};


handlePreCadastro(mock);

module.exports = {
	sendMatricula, newSurveyResponse,
};
