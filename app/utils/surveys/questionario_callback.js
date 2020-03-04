const help = require('../helper');
const DB = require('../DB_helper');
const { getResponseWithAnswers } = require('../../sm_api');
const { questionario } = require('../../server/models');
const events = require('../../server/models').sm_answer_event_log;
const { alunos } = require('../../server/models');
const indicados = require('../../server/models').indicacao_avaliadores;
const { surveysMaps } = require('../sm_maps');
const aux = require('./questionario_aux');
const followUp = require('./questionario_followUp');

async function followUpResposta(surveyName, answer, aluno, indicado) {
	switch (surveyName) {
	case 'atividade1':
		await followUp.handleAtividadeOne(answer, aluno);
		break;
	case 'indicacao360':
		return followUp.saveIndicados(answer, aluno);
	case 'avaliador360pre':
	case 'avaliador360pos':
		return followUp.saveAvaliacao360(surveyName, answer, indicado.id);
	case 'sondagemPre':
	case 'sondagemPos':
		return followUp.saveSondagem(surveyName, answer, aluno.id);
	case 'modulo1':
	case 'modulo2':
	case 'modulo3':
		return followUp.saveAvaliacaoModulo(surveyName, answer, aluno.id);
	}

	return false;
}

async function findSurveyTaker(answer) {
	try {
		const params = answer && answer.custom_variables ? answer.custom_variables : null;
		if (!params) { throw new Error('Erro: chegou a resposta de um questionário sem parâmetros customizados'); }
		let aluno = {};
		let indicado = null;

		if (params && params.cpf && params.cpf.toString()) {
			aluno = await alunos.findOne({ where: { cpf: params.cpf.toString() }, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro no findOne do alunos', err));
			if (!aluno || !aluno.id) throw new Error('Erro: Um aluno de cpf inválido respondeu o questinário');
		}

		if (params && params.pgid) aluno.pgid = params.pgid;
		if (params && params.turma) aluno.turma = params.turma;
		if (aluno && Object.keys(aluno).length === 0) aluno = null;

		if (params && params.indicaid) {
			indicado = await indicados.findOne({ where: { id: params.indicaid }, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro no findOne do indicados', err));
			if (!indicado || !indicado.id) throw new Error('Erro: Um indicado inválido respondeu o questinário');
		}

		return { aluno, indicado };
	} catch (error) {
		help.sentryError('Erro em findSurveyTaker', { error, answer });
		return null;
	}
}

async function getFormatedAnswer(answer, questionarioName) {
	try {
		let currentMap = surveysMaps[questionarioName];
		if (!currentMap) currentMap = await aux.buildPseudoMap(answer.survey_id); // build a generic map if we couldnt find a map (only works for the 3 avaliações)

		if (currentMap) {
			let respFormatada = await aux.getSpecificAnswers(currentMap, answer.pages);
			respFormatada = await aux.replaceChoiceId(respFormatada, currentMap, answer.survey_id);
			respFormatada = await aux.addCustomParametersToAnswer(respFormatada, answer.custom_variables);

			if (respFormatada && typeof respFormatada === 'object') {
				respFormatada.analyze_url = answer.analyze_url;
				respFormatada.answer_date = answer.date_modified;
				respFormatada.answer_saved_at = new Date();
				return respFormatada;
			}
			throw new Error({ msg: 'Erro: Não foi possível formatar as respostas', respFormatada });
		}

		throw new Error('Erro: Não foi possível encontrar um mapa');
	} catch (error) {
		help.sentryError('Erro no formatAnswer', error, questionarioName, answer);
		return 'Erro no formatAnswer';
	}
}

async function handleResponse(survey, fullAnswer, surveyTaker) {
	try {
		// format and save answer
		const answer = await getFormatedAnswer(fullAnswer, survey.name);
		if (!answer) { throw new Error('Erro: Não foi possível formatar a resposta'); }

		const respostaData = {
			id_surveymonkey: fullAnswer.id, id_questionario: survey.id, URL: fullAnswer.href, answer,
		};

		if (surveyTaker.aluno) { respostaData.id_aluno = surveyTaker.aluno.id; }
		if (surveyTaker.indicado) { respostaData.id_aluno = null; respostaData.id_indicado = surveyTaker.indicado.id; }
		const res = await DB.upsertRespostas(respostaData.id_surveymonkey, respostaData);
		if (!res || !res.id) { throw new Error('Erro: Não foi possível salvar a resposta na tabela'); }
		if (survey.name === 'atividade1') surveyTaker.aluno.newAnswerID = res.id;

		return followUpResposta(survey.name, answer, surveyTaker.aluno, surveyTaker.indicado);
	} catch (error) {
		help.sentryError('Erro em handleResponse', { error, survey, fullAnswer });
		return 'Erro em handleResponse';
	}
}

async function receiveAnswerEvent(event) {
	try {
		const { id } = await events.create({ sm_event_id: event.event_id, sm_survey_id: event.filter_id, answer_sm_id: event.object_id }).then((r) => r.dataValues).catch((err) => help.sentryError('Erro no update do events', err));
		if (!id) throw new Error('Erro: evento não foi salvo corretamente');

		// get questionario details
		const survey = await questionario.findOne({ where: { id_surveymonkey: event.filter_id.toString() }, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro no findOne do questionario', err));
		if (!survey) { throw new Error('Erro: Não foi encontrado o questionário'); }

		// load full answer
		const fullAnswer = await getResponseWithAnswers(survey.idSM, event.object_id);
		if (!fullAnswer) { throw new Error('Erro: Não foi encontrada a resposta'); }

		// find out who answered this survey
		const surveyTaker = await findSurveyTaker(fullAnswer, survey.name);
		if (!surveyTaker || (!surveyTaker.aluno && !surveyTaker.indicado)) { throw new Error({ msg: 'Erro: Não foi encontrado o Survey Taker', surveyTaker }); }

		await handleResponse(survey, fullAnswer, surveyTaker);
	} catch (error) {
		help.sentryError('Erro em receiveAnswerEvent', { error, events });
	}
}

module.exports = {
	receiveAnswerEvent, followUpResposta,
};
