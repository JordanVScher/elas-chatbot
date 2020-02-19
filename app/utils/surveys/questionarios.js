require('dotenv').config();
const { parse } = require('query-string');
const smData = require('../sm_surveys');
const { sentryError } = require('../helper');
const { getSurveyDetails } = require('../../sm_api');
const sync = require('../../server/models').questionario_sync;
const { questionario } = require('../../server/models');

async function loadQuestionarioData() {
	const res = [];
	const surveys = Object.keys(smData);

	for (let i = 0; i < surveys.length; i++) {
		const name = surveys[i];
		const info = smData[name];
		const [link, params] = info.link.split('?');
		const parameters = JSON.stringify(parse(params));
		const details = await getSurveyDetails(info.id);

		res.push({
			name, id_surveymonkey: info.id, link, parameters, details: JSON.stringify(details), created_at: new Date(), updated_at: new Date(),
		});
	}

	return res;
}

/**
 * Load entries from questionario_sync from all questionarios. If there's no entry on the table, we create and return it.
 * @return {array} array of questionario_sync objects Ex: [
 * { id: 1, id_questionario: 1, current_page: 1, last_verified: 2020-02-19T18:55:41.178Z,  next_verification: 2020-02-20T18:55:41.178Z, error_msg: null }
 ]
 */
async function getAllQuestionarioSyncs() {
	try {
		const res = [];
		const qIDs = await questionario.findAll({ where: {}, attributes: ['id'], raw: true }).then((r) => (r ? r.map((x) => x.id) : false)).catch((err) => sentryError('Erro no findAll do questionario', err));

		for (let i = 0; i < qIDs.length; i++) {
			const qID = qIDs[i];
			const qsync = await sync.findOrCreate({ where: { id_questionario: qID }, defaults: { id_questionario: qID, current_page: 1 } }).then((r) => r[0].dataValues).catch((err) => sentryError('Erro no findOrCreate do sync', err));
			res.push(qsync);
		}

		return res;
	} catch (error) {
		return sentryError('Erro em getAllQuestionarioSyncs', error);
	}
}

module.exports = {
	loadQuestionarioData, getAllQuestionarioSyncs,
};
