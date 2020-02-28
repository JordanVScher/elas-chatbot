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

async function formatAnswer(answer, questionarioName) {
	try {
		let res;
		let currentMap = surveysMaps[questionarioName];
		if (!currentMap) currentMap = await aux.buildPseudoMap(answer.survey_id); // build a generic map if we couldnt find a map (only works for the 3 avaliações)
		if (currentMap) {
			let respFormatado = await aux.getSpecificAnswers(currentMap, answer.pages);
			respFormatado = await aux.replaceChoiceId(respFormatado, currentMap, answer.survey_id);
			respFormatado = await aux.addCustomParametersToAnswer(respFormatado, answer.custom_variables);

			if (!respFormatado) {
				res = `Não foi possível formatar a resposta ${answer.id}`;
			} else {
				res = respFormatado;
			}
		} else {
			res = `Não foi encontrado um mapa para o questionário ${answer.survey_id}`;
		}

		return res;
	} catch (error) {
		sentryError('erro no formatAnswer', error);
		return 'Erro ao formatar resposta';
	}
}


async function getAnswerData(answer, questionarioID, questionarioName) {
	let erros = null;
	const data = {
		id_surveymonkey: answer.id,
		id_questionario: questionarioID,
		URL: answer.href,
		id_aluno: null,
		id_indicado: null,
	};

	// check if we have any custom_variables to identify who answered this question
	const params = answer.custom_variables;
	if (params.cpf && params.cpf.toString()) {
		const alunoID = await model.alunos.findOne({ where: { cpf: params.cpf.toString() }, attributes: ['id'], raw: true }).then((r) => (r ? r.id : null)).catch((err) => sentryError('Erro no findOne do alunos', err));
		if (alunoID) {
			data.id_aluno = alunoID;
		} else {
			erros = `Erro ao buscar o id do aluno pelo cpf! cpf: ${params.cpf}\n`;
		}
	} else if (params.indicaid) {
		const indicadoID = await model.indicacao_avaliadores.findOne({ where: { id: params.indicaid }, attributes: ['id'], raw: true }).then((r) => (r ? r.id : null)).catch((err) => sentryError('Erro no findOne do indicados', err));
		if (indicadoID) {
			data.id_indicado = indicadoID;
		} else {
			erros = `Erro ao salvar o id do indicado! indicado: ${params.indicaid}\n`;
		}
	} else {
		erros = 'Não temos nenhum parâmetro útil.\n';
	}

	const respostasFormatadas = await formatAnswer(answer, questionarioName);
	if (typeof respostasFormatadas === 'object') {
		data.answer = respostasFormatadas;
	} else if (respostasFormatadas) {
		erros += respostasFormatadas;
	} else {
		erros = 'Não foi possível formatar as respostas\n';
	}

	return { erros, data };
}


async function syncRespostas() {
	const result = {};
	const allSyncs = await getAllQuestionarioSyncs();
	for (let s = 0; s < allSyncs.length; s++) {
		const currentSync = allSyncs[s];
		const answers = await smAPI.getEveryAnswer(currentSync.id_SM, currentSync.current_page);
		for (let i = 0; i < answers.length; i++) {
			const answer = answers[i];
			let err = '';
			const { error, data } = await getAnswerData(answer, currentSync.id_questionario, currentSync.name);
			if (error) err = error;
			if (data) {
				const status = await model.respostas.create(data).then((r) => r.dataValues).catch((e) => sentryError(`Erro ao salvar resposta ${answer.id}.`, e));
				if (!status || !status.id) err += 'Não foi salvo com sucesso no banco!';
			}

			if (err) result[answer.id] = err;
		}
	}

	return result;
}

module.exports = {
	loadQuestionarioData, getAllQuestionarioSyncs, syncRespostas, getAnswerData,
};
