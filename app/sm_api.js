require('dotenv').config();

const fs = require('fs');
const request = require('requisition');
const { Sentry } = require('./utils/helper');
const { sentryError } = require('./utils/helper');

const url = process.env.SM_API_URL;
const headers = {
	Authorization: `Bearer ${process.env.SM_ACCESS_TOKEN}`,
	'Content-Type': 'application/json',
};

async function getSurveys() {
	let result = {};
	try {
		const res = await request(`${url}/surveys`).set(headers).query({ per_page: 100, page: 1 });
		result = await res.json();
	} catch (error) { console.log('Erro em getSurveys', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getSurveys');	}
	console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getSurveyIds() {
	const surveyIds = [];
	const surveys = await getSurveys();
	if (!surveys || !surveys.data) {
		console.log('Error! We dont have any surveys!');
	} else {
		surveys.data.forEach(async (element) => {
			surveyIds.push(element.id);
		});
	}

	return surveyIds;
}

async function getSurvey(id) {
	let result = {};
	try {
		const res = await request(`${url}/surveys/${id}`).set(headers);
		result = await res.json();
	} catch (error) { console.log('Erro em getSurveyInfo', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getSurveyInfo');	}
	console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getSurveyDetails(id) {
	let result = {};
	try {
		const res = await request(`${url}/surveys/${id}/details`).set(headers);
		result = await res.json();
	} catch (error) { console.log('Erro em getSurveyDetails', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getSurveyDetails');	}
	// console.log('getSurveyDetails', JSON.stringify(result, null, 2));
	return result;
}

async function getSurveyPages(id) {
	let result = {};
	try {
		const res = await request(`${url}/surveys/${id}/pages`).set(headers);
		result = await res.json();
	} catch (error) { console.log('Erro em getSurveyPages', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getSurveyPages'); }
	console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getSurveyPageDetails(id, pageId) {
	let result = {};
	try {
		const res = await request(`${url}/surveys/${id}/pages/${pageId}`).set(headers);
		result = await res.json();
	} catch (error) { console.log('Erro em getSurveyPageDetails', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getSurveyPageDetails'); }
	// console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getSurveyResponse(id, page = 1) {
	let result = {};
	try {
		const res = await request(`${url}/surveys/${id}/responses`).set(headers).query({ per_page: 100, page });
		result = await res.json();
	} catch (error) { console.log('Erro em getSurveyResponse', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getSurveyResponse'); }
	// console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getSurveyResponseDetailsBulk(id, page) {
	let result = {};
	try {
		const res = await request(`${url}/surveys/${id}/responses/bulk`).set(headers).query({ per_page: 100, page: page || 1 });
		result = await res.json();
	} catch (error) { console.log('Erro em getSurveyResponseDetailsBulk', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getSurveyResponseDetailsBulk'); }
	// console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getSurveyResponseDetails(id, responseId) {
	let result = {};
	try {
		const res = await request(`${url}/surveys/${id}/responses/${responseId}`).set(headers);
		result = await res.json();
	} catch (error) { console.log('Erro em getSurveyResponseDetails', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getSurveyResponseDetails'); }
	console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getResponseWithAnswers(id, responseId) {
	let result = {};
	try {
		const res = await request(`${url}/surveys/${id}/responses/${responseId}/details`).set(headers);
		result = await res.json();
	} catch (error) { console.log('Erro em getResponseWithAnswers', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getResponseWithAnswers'); }
	// console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getEveryAnswer(surveyId, pageNumber = 1) {
	const answers = []; // result array
	let totalOverall;
	let answerPage;

	do {
		answerPage = await getSurveyResponseDetailsBulk(surveyId, pageNumber); // get the response details
		totalOverall = answerPage.total; // get the total number of questions
		pageNumber += 1; // increase the page number

		answers.push(...answerPage.data);
	} while (totalOverall > answers.length); // while theres still answers to get
	// obs: if an error occurs, totalOverall will become undefined making the while condition false

	return answers;
}

async function getAvailableWebhooks() {
	let result = {};
	try {
		const res = await request(`${url}/webhooks`).set(headers);
		result = await res.json();
	} catch (error) { console.log('Erro em getAvailableWebhooks', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getAvailableWebhooks'); }
	console.log('my webhooks', JSON.stringify(result, null, 2));
	return result;
}

async function deleteOneWebhook(id) {
	let result = {};
	try {
		const res = await request.delete(`${url}/webhooks/${id}`).set(headers);
		result = await res.json();
	} catch (error) { console.log('Erro em deleteOneWebhook', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em deleteOneWebhook'); }
	console.log('Deleted', JSON.stringify(result, null, 2));
	return result;
}

async function saveAnswers(qID) {
	try {
		const data = await getEveryAnswer(qID);
		if (data) {
			let text = `Data: ${new Date()}\nNúmero de Respostas: ${data.length}\n\n`;
			text += JSON.stringify(data, null, 2);
			await fs.writeFileSync(`${qID}_respostas.txt`, text);
		}

		return data;
	} catch (error) {
		sentryError('Erro em saveAnswers', { qID, error });
		return false;
	}
}

async function postWebhook(name, event_type, object_type, object_ids, subscription_url) { // eslint-disable-line
	let result = {};
	try {
		const res = await request.post(`${url}/webhooks`).set(headers).send({
			name, event_type, object_type, object_ids, subscription_url,
		});
		result = await res.json();
		if (!result || result.error) { throw result.error; }
	} catch (error) { console.log('Erro em postWebhook', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em postWebhook'); }
	console.log('webhook created', JSON.stringify(result, null, 2));
	return result;
}

async function deleteAllWebhooks() {
	const availableWebhooks = await getAvailableWebhooks();
	if (!availableWebhooks || !availableWebhooks.data || availableWebhooks.length === 0 || availableWebhooks.data.length === 0) {
		console.log('There are no more webhooks to delete');
	} else {
		availableWebhooks.data.forEach(async (element) => {
			await deleteOneWebhook(element.id);
		});
		console.log('Done!');
	}
}

async function createNewWebhook(urlHook, surveyIDs) {
	await deleteAllWebhooks();

	if (!urlHook) {
		console.log('No URL!');
	} else if (!surveyIDs) {
		surveyIDs =	await getSurveyIds(); // eslint-disable-line
	} else {
		postWebhook('webhook_homol', 'response_completed', 'survey', surveyIDs, `${process.env.LINK_HOMOL}/webhook`);
		postWebhook('webhook_local', 'response_completed', 'survey', surveyIDs, `${urlHook}/webhook`);
		// postWebhook('webhook_prod', 'response_completed', 'survey', surveyIDs, `${urlHook}/webhook`);
	}
}


module.exports = {
	getSurveys,
	getSurveyIds,
	getSurvey,
	getSurveyDetails,
	getSurveyPages,
	getSurveyPageDetails,
	getSurveyResponse,
	getSurveyResponseDetailsBulk,
	getEveryAnswer,
	getSurveyResponseDetails,
	getResponseWithAnswers,
	getAvailableWebhooks,
	deleteOneWebhook,
	postWebhook,
	createNewWebhook,
	deleteAllWebhooks,
	saveAnswers,
};
