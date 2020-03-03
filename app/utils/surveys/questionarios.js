require('dotenv').config();
const { parse } = require('query-string');
const smData = require('../sm_surveys');
const { surveysMaps } = require('../sm_maps');
const { sentryError } = require('../helper');
const smAPI = require('../../sm_api');
const model = require('../../server/models');
const aux = require('./questionario_aux');

async function loadQuestionarioData() {
	const res = [];
	const surveys = Object.keys(smData);

	for (let i = 0; i < surveys.length; i++) {
		const name = surveys[i];
		const info = smData[name];
		const [link, params] = info.link.split('?');
		const parameters = JSON.stringify(parse(params));
		const details = await smAPI.getSurveyDetails(info.id);

		res.push({
			name, id_surveymonkey: info.id, link, parameters, details: JSON.stringify(details), created_at: new Date(), updated_at: new Date(),
		});
	}

	return res;
}

/**
 * Load entries from questionario_sync from all questionarios. If there's no entry on the table, we create and return it. Add idSM from questionarios to the sync obj.
 * @return {array} array of questionario_sync objects Ex: [
 * { id: 1, id_questionario: 1, current_page: 1, last_verified: DATE, next_verification: DATE, error_msg: {}, id_SM: '123' }
 ]
 */
async function getAllQuestionarioSyncs() {
	try {
		const res = [];
		const questionarios = await model.questionario.findAll({ where: {}, attributes: ['id', 'idSM', 'name'], raw: true }).then((r) => r).catch((err) => sentryError('Erro no findAll do questionario', err));

		for (let i = 0; i < questionarios.length; i++) {
			const qID = questionarios[i].id;
			const qsync = await model.sync.findOrCreate({ where: { id_questionario: qID }, defaults: { id_questionario: qID, current_page: 1 } }).then((r) => r[0].dataValues).catch((err) => sentryError('Erro no findOrCreate do sync', err));
			qsync.id_SM = questionarios[i].idSM;
			res.push(qsync);
		}

		return res;
	} catch (error) {
		sentryError('Erro em getAllQuestionarioSyncs', error);
		return false;
	}
}


// async function syncRespostas() {
// 	const result = {};
// 	const allSyncs = await getAllQuestionarioSyncs();
// 	for (let s = 0; s < allSyncs.length; s++) {
// 		const currentSync = allSyncs[s];
// 		const answers = await smAPI.getEveryAnswer(currentSync.id_SM, currentSync.current_page);
// 		for (let i = 0; i < answers.length; i++) {
// 			const answer = answers[i];
// 			let err = '';
// 			const { error, data } = await getAnswerData(answer, currentSync.id_questionario, currentSync.name);
// 			if (error) err = error;
// 			if (data) {
// 				const status = await model.respostas.create(data).then((r) => r.dataValues).catch((e) => sentryError(`Erro ao salvar resposta ${answer.id}.`, e));
// 				if (!status || !status.id) err += 'Não foi salvo com sucesso no banco!';
// 			}

// 			if (err) result[answer.id] = err;
// 		}
// 	}

// 	return result;
// }

module.exports = {
	loadQuestionarioData, getAllQuestionarioSyncs,
};
