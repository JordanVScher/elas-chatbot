const { questionario } = require('../../server/models');
const { alunos } = require('../../server/models');
const DB = require('../DB_helper');
const { getResponseWithAnswers } = require('../../sm_api');
const { getAnswerData } = require('./questionarios');
const { sentryError } = require('../helper');
const smHelp = require('../sm_help');

async function answerFollowUp(data, surveyName) {
	if (surveyName === 'atividade1') {
		data.answer.added_by_admin = true;
		data.answer.turma_id = await DB.getTurmaIdFromAluno(data.id_aluno);
		const newUser = await DB.upsertAlunoCadastro(data.answer);
		if (newUser && newUser.id) { // if everything went right we update a few things
			console.log('Atualizou usuário com sucesso');
			const a = await DB.upsertAtividade(newUser.id, 'atividade_1', data.answer);
			if (a && a.id) console.log('Salvou na antiga resposta com sucesso');

			await smHelp.helpAddQueue(newUser.id, newUser.turma_id);
			await smHelp.sendAlunaToAssistente(newUser.nome_completo, newUser.email, newUser.cpf, await DB.getTurmaName(data.turma_id));
			if (newUser.email === newUser.contato_emergencia_email) console.log(`Aluna ${newUser.id} tem o mesmo email que o contato ${newUser.email}`);
		}
	}

	return 'Fim';
}


async function saveAnswer(questionarioID, answerID, alunoCPF) {
	const survey = await questionario.findOne({ where: { id: questionarioID }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findOne do questionario', err));
	const answer = await getResponseWithAnswers(survey.idSM, answerID);
	const { error, data } = await getAnswerData(answer, questionarioID, survey.name); // eslint-disable-line no-unused-vars
	if (error) return { error, data };
	if (alunoCPF) { data.answer.cpf = alunoCPF.toString(); }
	if (!data.id_aluno) data.id_aluno = await alunos.findOne({ where: { cpf: data.answer.cpf.toString() }, attributes: ['id'], raw: true }).then((r) => (r ? r.id : null)).catch((err) => sentryError('Erro no findOne do alunos', err));
	const res = await DB.upsertRespostas(data.id_surveymonkey, data);
	if (res && res.id) {
		console.log('Salvou nova resposta com sucesso');
		return answerFollowUp(data, survey.name);
	}

	return { error: 'Erro ao salvar', data };
}

module.exports = { saveAnswer };
