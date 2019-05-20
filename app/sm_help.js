const smAPI = require('./sm_api');

async function newSurveyResponse(event) {
	const responses =	await smAPI.getSurveyResponse(event.filter_id, event.object_id);
}
