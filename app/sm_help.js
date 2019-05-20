const smAPI = require('./sm_api');
const { reloadSpreadSheet } = require('./utils/helper');

async function newSurveyResponse(event) {
	const responses =	await smAPI.getSurveyResponse(event.filter_id, event.object_id);
	const turmaData = reloadSpreadSheet();
}
