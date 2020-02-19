require('dotenv').config();
const { parse } = require('query-string');
const smData = require('../sm_surveys');
const { sentryError } = require('../helper');
const smAPI = require('../../sm_api');
const sync = require('../../server/models').questionario_sync;
const { questionario } = require('../../server/models');
const { respostas } = require('../../server/models');
const { alunos } = require('../../server/models');
const indicados = require('../../server/models').indicacao_avaliadores;

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
 * { id: 1, id_questionario: 1, current_page: 1, last_verified: DATE,  next_verification: DATE, error_msg: {}, id_SM: '123' }
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


async function updateRespostas(answer, questionarioID) {
	let res = null;
	const resposta = await respostas.findOne({ where: { id_surveymonkey: answer.id }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findOne do respostas', err));
	if (!resposta || !resposta.id) { // dont update if we already saved this answer
		const aux = {
			id_surveymonkey: answer.id,
			id_questionario: questionarioID,
			URL: answer.href,
		};

		// check if we have any custom_variables to identify who answered this question
		const params = answer.custom_variables;
		if (params.cpf) {
			const alunoID = await alunos.findOne({ where: { cpf: params.cpf }, attributes: ['id'], raw: true }).then((r) => r.id).catch((err) => sentryError('Erro no findOne do alunos', err));
			if (alunoID) {
				aux.id_aluno = alunoID;
			} else {
				res = `Erro ao buscar o id do aluno pelo cpf! cpf: ${params.cpf}\n`;
			}
		} else if (params.indicaid) {
			const indicadoID = await indicados.findOne({ where: { id: params.indicaid }, attributes: ['id'], raw: true }).then((r) => r.id).catch((err) => sentryError('Erro no findOne do indicados', err));
			if (indicadoID) {
				aux.id_indicado = indicadoID;
			} else {
				res = `Erro ao salvar o id do indicado! indicado: ${params.indicaid}\n`;
			}
		} else {
			res = 'Não temos nenhum parâmetro útil.\n';
		}


		const status = await respostas.create(aux).then((r) => r.dataValues).catch((err) => sentryError(`Erro ao salvar resposta ${answer.id}.`, err));
		if (!status || !status.id) res += 'Não foi salvo com sucesso no banco!';
	}
	return res;
}


async function syncRespostas() {
	const result = [];
	const allSyncs = await getAllQuestionarioSyncs();

	for (let s = 0; s < allSyncs.length; s++) {
		const currentSync = allSyncs[s];
		const answers = await smAPI.getEveryAnswer(sync.id_SM, sync.current_page);
		for (let i = 0; i < answers.length; i++) {
			const answer = answers[i];
			const res = await updateRespostas(answer, currentSync.id_questionario);
			if (res) result.push(res);
		}
	}

	return result;
}


module.exports = {
	loadQuestionarioData, getAllQuestionarioSyncs, syncRespostas,
};
