require('dotenv').config();

const request = require('requisition');
const { Sentry } = require('./utils/helper');

const url = process.env.SM_API_URL;
const headers = {
	Authorization: `Bearer ${process.env.SM_ACCESS_TOKEN}`,
	'Content-Type': 'application/json',
};

async function getSurveys() { // eslint-disable-line
	let result = {};
	try {
		const res = await request(`${url}/surveys`).set(headers).query({ per_page: 100, page: 1 });
		result = await res.json();
	} catch (error) { console.log('Erro em getSurveys', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getSurveys');	}
	console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getSurvey(id) { // eslint-disable-line
	let result = {};
	try {
		const res = await request(`${url}/surveys/${id}`).set(headers);
		result = await res.json();
	} catch (error) { console.log('Erro em getSurveyInfo', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getSurveyInfo');	}
	console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getSurveyDetails(id) { // eslint-disable-line
	let result = {};
	try {
		const res = await request(`${url}/surveys/${id}/details`).set(headers);
		result = await res.json();
	} catch (error) { console.log('Erro em getSurveyDetails', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getSurveyDetails');	}
	console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getSurveyPages(id) { // eslint-disable-line
	let result = {};
	try {
		const res = await request(`${url}/surveys/${id}/pages`).set(headers);
		result = await res.json();
	} catch (error) { console.log('Erro em getSurveyPages', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getSurveyPages'); }
	console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getSurveyPageDetails(id, pageId) { // eslint-disable-line
	let result = {};
	try {
		const res = await request(`${url}/surveys/${id}/pages/${pageId}`).set(headers);
		result = await res.json();
	} catch (error) { console.log('Erro em getSurveyPageDetails', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getSurveyPageDetails'); }
	console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getSurveyResponse(id) { // eslint-disable-line
	let result = {};
	try {
		const res = await request(`${url}/surveys/${id}/responses`).set(headers).query({ per_page: 100 });
		result = await res.json();
	} catch (error) { console.log('Erro em getSurveyResponse', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getSurveyResponse'); }
	console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getSurveyResponseDetails(id, responseId) { // eslint-disable-line
	let result = {};
	try {
		const res = await request(`${url}/surveys/${id}/responses/${responseId}`).set(headers);
		result = await res.json();
	} catch (error) { console.log('Erro em getSurveyResponseDetails', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getSurveyResponseDetails'); }
	console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getAvailableWebhooks() { // eslint-disable-line
	let result = {};
	try {
		const res = await request(`${url}/webhooks`).set(headers);
		result = await res.json();
	} catch (error) { console.log('Erro em getAvailableWebhooks', JSON.stringify(result, null, 2)); Sentry.captureMessage('Erro em getAvailableWebhooks'); }
	console.log(JSON.stringify(result, null, 2));
	return result;
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
	console.log(JSON.stringify(result, null, 2));
	return result;
}

module.exports = {
	getSurveys, getSurvey, getSurveyDetails, getSurveyPages, getSurveyPageDetails, getSurveyResponse, getSurveyResponseDetails, getAvailableWebhooks, postWebhook,
};
