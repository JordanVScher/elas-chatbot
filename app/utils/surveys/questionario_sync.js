const { parse } = require('query-string');
const help = require('../helper');
const smAPI = require('../../sm_api');
const smData = require('../sm_surveys');
const { questionario } = require('../../server/models');
const { respostas } = require('../../server/models');
const qSync = require('../../server/models').questionario_sync;
const { findSurveyTaker } = require('./questionario_callback');
const { handleResponse } = require('./questionario_callback');

/**
 * Loads questionaria data from the envs. Used on the migration "populate_questionario_table".
 * @return {array} array of questionario objects
 */
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
 * Load entries from questionario_sync from all questionarios. If there's no entry on the table, we create and return it.
 * Also adds surveys from questionario table to the sync obj.
 * @return {array} array of questionario_sync objects
 */
async function getAllQuestionarioSyncs() {
	try {
		const res = [];
		const surveys = await questionario.findAll({ where: {}, attributes: ['id', 'idSM', 'name', 'details'], raw: true }).then((r) => r).catch((err) => help.sentryError('Erro no findAll do questionario', err));

		for (let i = 0; i < surveys.length; i++) {
			const survey = surveys[i];
			const sync = await qSync.findOrCreate({ where: { id_questionario: survey.id }, defaults: { id_questionario: survey.id, current_page: 1 } }).then((r) => r[0].dataValues).catch((err) => help.sentryError('Erro no findOrCreate do sync', err));
			sync.survey = survey;
			res.push(sync);
		}

		return res;
	} catch (error) {
		help.sentryError('Erro em getAllQuestionarioSyncs', error);
		return false;
	}
}

/**
 * Does the actual sync with the answers on SM.
 * 1. load all the syncs with their respective surveys and loop through them
 * 2. load all the answers we already have from that survey.
 * 3. load all the answers on SM from that survey
 * 4. loop through all the answers from SM. If a answer is already saved we ignore it. If it's a new one we must save it.
 * 5. identify the user that owns that particular answer
 * 6. save the answer with the user and follow through with each kind of answer on handleResponse
 * @param {number} syncID a way to limit which sync is going to run. If null, all syncs will run. If present, only that specific sync will run.
 * @return {array} array of with the details of the procedure
 * That are 3 status each answer on each survey can have:
 * 1. ok - everything worked fine, answer was saved correctly
 * 2. já estava salvo - answer ignored because it was saved already
 * 3. error: something went wrong, not necessarily on the code. Maybe the answer doens't have the params necessary to find out who's the SurveyTaker.
 * In a case like that, you have to manually save the answer to a user using the /save-answer endpoint.
 * This way, next time this procedure runs, the answer with an error will be ignored because it is saved already.
 */
async function syncRespostas(syncID) {
	const results = [];
	let allSyncs = await getAllQuestionarioSyncs();
	if (!allSyncs || allSyncs.length === 0) throw new help.MyError('Erro ao carregar syncs', { allSyncs });

	if (syncID) {
		const theOneWeWant = allSyncs.find((x) => x.id === syncID);
		if (!theOneWeWant) throw new help.MyError('Não encontramos o sync com o ID passado', { allSyncs, syncID });
		allSyncs = [];
		allSyncs.push(theOneWeWant);
	}

	for (let i = 0; i < allSyncs.length; i++) {	// loop through each sync and its respective survey
		const result = {}; result.errors = []; let ultimaPagina;
		const currentSync = allSyncs[i];
		result.syncID = currentSync.id;
		try {
			const { survey } = currentSync;
			const savedAnswersID = await respostas.findAll({ where: { id_questionario: survey.id }, attributes: ['id_surveymonkey'], raw: true }).then((r) => (r ? r.map((x) => x.id_surveymonkey) : r)).catch((err) => help.sentryError('Erro no findAll do respostas', err));
			const { answers, lastPage } = await smAPI.getEveryAnswer(survey.idSM, currentSync.current_page);

			ultimaPagina = lastPage;
			if (!answers || answers.length === 0) { throw new help.MyError('Erro ao carregar respostas', { currentSync: currentSync.id, survey: survey.id, answers, moment: new Date() }); } // eslint-disable-line object-curly-newline
			result.answersLength = answers.length;
			for (let j = 0; j < answers.length; j++) { // loop through each answer on that survey
				const answer = answers[j];
				try {
					if (savedAnswersID.includes(answer.id)) { // dont save same answer again
						result[`resposta_${answer.id}`] = 'já estava salvo';
					} else {
						const surveyTaker = await findSurveyTaker(answer, survey.name);
						if (!surveyTaker || (!surveyTaker.aluno && !surveyTaker.indicado)) { throw new help.MyError('Erro: Não foi encontrado o Survey Taker', { surveyTaker, answer: answer.id, survey: survey.id, moment: new Date() }); } // eslint-disable-line object-curly-newline

						const res = await handleResponse(survey, answer, surveyTaker);
						if (res && res.error) {
							result[`resposta_${answer.id}`] = 'erro';
							result.errors.push({ answer: answer.id, e: res.error, currentSync: currentSync.id });
						} else {
							result[`resposta_${answer.id}`] = 'ok';
						}
					}
				} catch (e) {
					result.errors.push({ e, answer: answer.id, currentSync: currentSync.id });
				}
			}
		} catch (error) {
			result.errors.push(error);
		}

		if (!result.errors || result.errors.length === 0) currentSync.current_page = ultimaPagina; // only update page if there were no errors
		let errorsUpdate = null;
		if (result.errors && result.errors.length > 0) errorsUpdate = result.errors;
		const now = new Date();
		await qSync.update({ last_verified: now, current_page: currentSync.current_page, error_msg: errorsUpdate }, { where: { id: currentSync.id }, raw: true, plain: true, returning: true }).then((r) => r[1]).catch((err) => help.sentryError('Erro no update do model', err)); // eslint-disable-line object-curly-newline

		results.push({ [`sync_${currentSync.id}`]: result });
	}

	return results;
}


module.exports = {
	getAllQuestionarioSyncs, syncRespostas, loadQuestionarioData,
};
