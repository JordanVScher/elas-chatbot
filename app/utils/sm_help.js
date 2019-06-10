const helper = require('./helper');
const smAPI = require('../sm_api');
const { sendTestMail } = require('./mailer');
const surveyIDs = require('./sm_surveys');
const { eMail } = require('./flow');
const db = require('./DB_helper');

const preCadastro = process.env.FORM_PRECADASTRO;

// const mockEvent = {
// 	event_datetime: '2019-06-04T18:26:15.326900+00:00',
// 	resources:
// 	{
// 		respondent_id: '10776014041',
// 		recipient_id: '0',
// 		user_id: '134607003',
// 		collector_id: '234215909',
// 		survey_id: '175896322',
// 	},
// 	name: 'novo webhook',
// 	object_id: '10776014041',
// 	filter_id: '175896322',
// 	event_id: '10014719098',
// 	object_type: 'response',
// 	filter_type: 'survey',
// 	event_type: 'response_completed',
// };


// after a payement happens we send an e-mail to the buyer with the matricula/pre-cadastro form
async function sendMatricula(productID, buyerEmail) {
	try {
		const spreadsheet = await helper.reloadSpreadSheet(); // console.log('spreadsheet', spreadsheet); // load spreadsheet
		const column = await spreadsheet.find(x => x.pagseguroId.toString() === productID.toString()); console.log('column', column); // get same product id (we want to know the "turma")
		const newUrl = preCadastro.replace('TURMARESPOSTA', column.turma); // pass turma as a custom_parameter
		const newText = eMail.preCadastro.texto.replace('<TURMA>', column.turma).replace('<LINK>', newUrl); // prepare mail text
		await sendTestMail(eMail.preCadastro.assunto, newText, buyerEmail);
	} catch (error) {
		console.log('Erro em sendMatricula', error); helper.Sentry.captureMessage('Erro em sendMatricula');
	}
}

// sendMatricula(1, 'jordan@appcivico.com');

const preCadastroMap = [
	{
		questionID: '278631055',
		paramName: 'nome',
	},
	{
		questionID: '289947676',
		paramName: 'email',
	},
	{
		questionID: '290701123',
		paramName: 'telefone',
	},
	{
		questionID: '278631561',
		paramName: 'primeiroDropdown',
		dropdown: true,
	},
];

// gets the answer from the survey response object
async function getAnswer(answers) {
	let result = '';
	if (await Array.isArray(answers) && answers.length === 1) {
		if (answers[0].other_id) { // multiple choice (other + description)
			// const aux = {};	aux[answers[0].other_id] = `<outros>${answers[0].text}`;
			result = `<outros>${answers[0].text}`; // add <outros> to signal user choosing outros option
		} else if (answers[0].text) { // text/comment box
			result = answers[0].text;
		} else if (answers[0].choice_id) { // multiple choice (regular) / dropdown
			result = answers[0].choice_id;
		}
	}

	return result;
}

// uses the map to find the answers on the survey response
async function getSpecificAnswers(map, responses) {
	const result = {};

	for (let i = 0; i < responses.length; i++) { // iterate through the pages in the responses
		const page = responses[i]; // get page
		if (page.questions) { // check if the page has any questions
			for (let j = 0; j < page.questions.length; j++) { // iterate through the questions
				const question = page.questions[j]; // get question
				if (question.answers) { // check if the question has answers
					const desiredQuestion = await map.find(x => x.questionID.toString() === question.id.toString()); // check if this question is one of the question we're looking for
					if (desiredQuestion) { // check if we found a desirable question
						const theAnswer = await getAnswer(question.answers); // get the actual answer from the question
						if (theAnswer) { // check if we did find an answer
							result[desiredQuestion.paramName] = theAnswer; // create an aux obj with the name of the param and the answer found
						}
					}
				}
			}
		}
	}

	return result;
}

async function replaceChoiceId(answers, map, surveyID) {
	const result = answers;
	const findDropdown = map.filter(x => x.dropdown === true);

	if (findDropdown && findDropdown.length > 0) { // check if we have an answer that needs replacement (choice.id isnt the actual answer)
		const survey = await smAPI.getSurveyDetails(surveyID); // load survey and separate the questions (load the details noew because we know we will need them)
		const questionDetails = survey.pages[0].questions;

		await findDropdown.forEach((element) => { // for each map element we should replace
			if (result[element.paramName] && result[element.paramName].slice(0, 8) !== '<outros>') { // check if the answers array actually has that answer and it's not an "Others" option
				const findQuestion = questionDetails.find(x => x.id.toString() === element.questionID.toString());
				// find the answer that has the same choice_id as the answer we have salved
				const findAnswer = findQuestion.answers.choices.find(x => x.id.toString() === result[element.paramName].toString());
				result[element.paramName] = findAnswer.text; // replace the choice_id saved with the actual text of the option
			}
		});
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
	response.custom_variables = {
		turma: 'turma 10',
		cpf: '123456789-11',
	};

	let answers = await getSpecificAnswers(preCadastroMap, response.pages);
	answers = await replaceChoiceId(answers, preCadastroMap, response.survey_id);

	const newText = eMail.depoisMatricula.texto.replace('<NOME>', answers.nome); // prepare mail text
	await sendTestMail(eMail.depoisMatricula.assunto, newText, answers.email);

	await db.upsertAluno(answers.nome, response.custom_variables.cpf, response.custom_variables.turma, answers.email);
}

// what to do with the form that was just answered
async function newSurveyResponse(event) {
	const responses = await smAPI.getResponseWithAnswers(event.filter_id, event.object_id); console.log('responses', JSON.stringify(responses)); // get details of the event

	switch (responses.survey_id) { // which survey was answered?
	case surveyIDs.preCadastro:
		await handlePreCadastro(responses);
		break;

	default:
		break;
	}
}

// handlePreCadastro(responses);

module.exports = {
	sendMatricula, newSurveyResponse,
};