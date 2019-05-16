require('dotenv').config();

const { SurveyMonkeyAPI } = require('surveymonkey');
const { promisify } = require('util');
const { Sentry } = require('./utils/helper');

const accessToken = process.env.SM_ACCESS_TOKEN;
let api;

try {
	api = new SurveyMonkeyAPI(accessToken, { version: 'v3', secure: false });
} catch (error) {
	console.log('Could not authenticate SM', error.message);
}


async function getSurveyList() {
	api.getSurveyListPromise = await promisify(api.getSurveyList);
	const result = await api.getSurveyListPromise();
	if (result.error) { console.log('Erro em getSurveyList', result); Sentry.captureMessage('Erro em getSurveyList'); }
	console.log('result', result);
	return result || {};
}

getSurveyList();
