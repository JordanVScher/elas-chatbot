const smAPI = require('./sm_api');
const { reloadSpreadSheet } = require('./utils/helper');

async function newSurveyResponse(event) {
	console.log(event);

	const responses = await smAPI.getResponseWithAnswers(event.filter_id, event.object_id);
	console.log(responses);

	const turmaData = await reloadSpreadSheet();
	console.log(turmaData);
}

module.exports = {
	newSurveyResponse,
};
