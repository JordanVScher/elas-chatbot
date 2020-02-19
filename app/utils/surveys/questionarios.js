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
 * Load entries from questionario_sync from all questionarios. If there's no entry on the table, we create and return it. Add idSM from questionarios to the sync obj.
 * @return {array} array of questionario_sync objects Ex: [
 * { id: 1, id_questionario: 1, current_page: 1, last_verified: DATE,  next_verification: DATE, error_msg: {}, id_SM: '123' }}
 ]
 */
async function getAllQuestionarioSyncs() {
	try {
		const res = [];
		const questionarios = await questionario.findAll({ where: {}, attributes: ['id', 'idSM'], raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do questionario', err));

		for (let i = 0; i < questionarios.length; i++) {
			const qID = questionarios[i].id;
			const qsync = await sync.findOrCreate({ where: { id_questionario: qID }, defaults: { id_questionario: qID, current_page: 1 } }).then((r) => r[0].dataValues).catch((err) => sentryError('Erro no findOrCreate do sync', err));
			qsync.id_SM = questionarios[i].idSM;
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
