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
	case 'atividade1InCompany':
		return followUp.handleAtividadeOne(answer, aluno);
	// case 'indicacao360':
	// 	return followUp.saveIndicados(answer, aluno);
	// case 'avaliador360pre':
	// case 'avaliador360pos':
	// 	return followUp.saveAvaliacao360(surveyName, answer, indicado.id);
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

// how to save an answer: (get mock from exemplo_de_respostas)
// (async () => {
// 	const surverName = 'sondagemPos'
// 	const answer = await getFormatedAnswer(mock, surverName);
// 	const a = await followUp.saveSondagem(surverName, answer, 1);
// 	console.log('a', a);
// })();


async function findSurveyTaker(answer) {
	try {
		const params = answer && answer.custom_variables ? answer.custom_variables : null;
		if (!params) { throw new help.MyError('Chegou a resposta de um questionário sem parâmetros customizados', { answer: answer.id }); }
		let aluno = {};
		let indicado = null;

		if (params && params.cpf && params.cpf.toString()) {
			aluno = await alunos.findOne({ where: { cpf: params.cpf.toString() }, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro no findOne do alunos', err));
			if (!aluno || !aluno.id) throw new help.MyError('Um aluno de cpf inválido respondeu o questinário', { params });
		}

		if (params && params.pgid) aluno.pgid = params.pgid;
		if (params && params.turma) aluno.turma = params.turma;
		if (aluno && Object.keys(aluno).length === 0) aluno = null;

		if (params && params.indicaid) {
			indicado = await indicados.findOne({ where: { id: params.indicaid }, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro no findOne do indicados', err));
			if (!indicado || !indicado.id) throw new help.MyError('Um indicado inválido respondeu o questinário', { params });
		}

		return { aluno, indicado };
	} catch (error) {
		help.sentryError('Erro em findSurveyTaker', { error, answer });
		return { msg: 'Erro em findSurveyTaker', error };
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
			throw new help.MyError('Não foi possível formatar as respostas', { currentMap, respFormatada, answer: answer.id }); // eslint-disable-line object-curly-newline
		}

		throw new help.MyError('Não foi possível encontrar um mapa', { currentMap, questionarioName, answer: answer.id });
	} catch (error) {
		help.sentryError('Erro no formatAnswer', error, questionarioName, answer);
		return { msg: 'Erro no formatAnswer', error };
	}
}

async function handleResponse(survey, fullAnswer, surveyTaker) {
	try {
		// format and save answer
		const answer = await getFormatedAnswer(fullAnswer, survey.name);
		if (!answer || answer.error) { throw new help.MyError('Não foi possível formatar a resposta', { fullAnswer: fullAnswer.id, survey: survey.id, answer }); }

		const respostaData = {
			id_surveymonkey: fullAnswer.id, id_questionario: survey.id, URL: fullAnswer.href, answer,
		};

		if (surveyTaker.aluno) { respostaData.id_aluno = surveyTaker.aluno.id; }
		if (surveyTaker.indicado) { respostaData.id_aluno = null; respostaData.id_indicado = surveyTaker.indicado.id; }

		const res = await DB.upsertRespostas(respostaData.id_surveymonkey, respostaData);
		if (!res || !res.id) { throw new help.MyError('Não foi possível salvar a resposta na tabela', { respostaData, res }); }

		if (survey.name === 'atividade1' || survey.name === 'atividade1InCompany') surveyTaker.aluno.newAnswerID = res.id;
		return followUpResposta(survey.name, answer, surveyTaker.aluno, surveyTaker.indicado);
	} catch (error) {
		help.sentryError('Erro em handleResponse', { error, survey: survey.id, fullAnswer: fullAnswer.id });
		return { error };
	}
}

async function receiveAnswerEvent(event) {
	try {
		const { id } = await events.create({ sm_event_id: event.event_id, sm_survey_id: event.filter_id, answer_sm_id: event.object_id }).then((r) => r.dataValues).catch((err) => help.sentryError('Erro no update do events', err));
		if (!id) throw new help.MyError('Evento não foi salvo corretamente', { event });

		// get questionario details
		const survey = await questionario.findOne({ where: { id_surveymonkey: event.filter_id.toString() }, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro no findOne do questionario', err));
		if (!survey) { throw new help.MyError('Não foi encontrado o questionário', { id_surveymonkey: event.filter_id, survey }); }

		// load full answer
		const answer = await getResponseWithAnswers(survey.idSM, event.object_id);
		if (!answer || answer.error) { throw new help.MyError('Não foi encontrada a resposta', { answer, survey: survey.id, responseID: event.object_id }); }

		// find out who answered this survey
		const surveyTaker = await findSurveyTaker(answer, survey.name);
		if (!surveyTaker || (!surveyTaker.aluno && !surveyTaker.indicado)) { throw new help.MyError('Não foi encontrado o Survey Taker', { surveyTaker, answer: answer.id, survey: survey.id }); } // eslint-disable-line object-curly-newline

		return handleResponse(survey, answer, surveyTaker);
	} catch (error) {
		help.sentryError('Erro em receiveAnswerEvent', { error, events });
		return error;
	}
}

async function saveAnswer(questionarioID, answerID, alunoID, indicadoID) {
	try {
		// get questionario details
		const survey = await questionario.findOne({ where: { id: questionarioID.toString() }, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro no findOne do questionario', err));
		if (!survey) { throw new help.MyError('Não foi encontrado o questionario', { survey: survey.id }); }

		// load full answer
		const answer = await getResponseWithAnswers(survey.idSM, answerID);
		if (!answer || answer.error) { throw new help.MyError('Não foi encontrada a resposta', { answer, survey: survey.id, answerID }); } // eslint-disable-line object-curly-newline

		// find out who answered this survey
		const surveyTaker = {};
		if (alunoID) surveyTaker.aluno = await alunos.findOne({ where: { id: alunoID }, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro no alunos do model', err));
		if (indicadoID) surveyTaker.indicado = await indicados.findOne({ where: { id: indicadoID }, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro no findOne do indicados', err));
		if (!surveyTaker || surveyTaker.error || (!surveyTaker.aluno && !surveyTaker.indicado)) throw new help.MyError('Não foi encontrado ninguém com esse ID', { alunoID, indicadoID });

		return handleResponse(survey, answer, surveyTaker);
	} catch (error) {
		help.sentryError('Erro em saveAnswer', error);
		return error;
	}
}

module.exports = {
	receiveAnswerEvent, saveAnswer, findSurveyTaker, handleResponse,
};
