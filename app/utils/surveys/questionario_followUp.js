const fs = require('fs');
const aux = require('./questionario_aux');
const help = require('../helper');
const mailer = require('../mailer');
const DB = require('../DB_helper');
const addQueue = require('../notificationAddQueue');
const { surveysMaps } = require('../sm_maps');
const { alunos } = require('../../server/models');

async function saveIndicados(response, alunaID) {
	try {
		const errors = [];
		const baseAnswers = await aux.formatAnswers(response.pages[0].questions);
		const aluna = await alunos.findOne({ where: { id: alunaID }, raw: true }).then((r) => (r)).catch((err) => help.sentryError('Erro no findOne do alunos', err));

		const full = surveysMaps.indicacao360;

		const indicacao360 = [];
		const familiar360 = [];
		full.forEach((e) => {
			if (e.paramName.charAt(0) !== 'F') {
				indicacao360.push(e);
			} else {
				familiar360.push(e);
			}
		});

		let indicados = {}; // could just as well be an array with the answers
		await indicacao360.forEach(async (element) => { // getting the answers for the indicados
			const temp = baseAnswers.find((x) => x.id === element.questionID);
			indicados[element.paramName] = temp && temp.text ? temp.text : '';
		});

		// formatting the answers
		const indicacao = await aux.separateAnswer(Object.values(indicados), ['nome', 'email', 'telefone']) || [];
		// saving each avaliador, if theres an e-mail
		for (let i = 0; i < indicacao.length; i++) {
			const ind = indicacao[i];
			try {
				if (ind.nome || ind.email || ind.tele) { // check if indicado has anything fulfilled
					if (!ind.email) errors.push({ id: 1, indicado: ind });
					if (ind.email && (ind.email === aluna.email)) errors.push({ id: 2, indicado: ind });
					ind.aluno_id = aluna.id; ind.familiar = false;
					await DB.upsertIndicado(ind);
				}
			} catch (error) {
				help.sentryError(`Erro ao salvar indicado ${ind.id}`, { indicado: ind, error });
			}
		}

		// getting the answers for the familiares
		indicados = {}; // cleaning up
		await familiar360.forEach(async (element) => {
			const temp = baseAnswers.find((x) => x.id === element.questionID);
			indicados[element.paramName] = temp && temp.text ? temp.text : '';
		});

		// saving each familiar
		const familiar = await aux.separateAnswer(Object.values(indicados), ['nome', 'relacao_com_aluna', 'email', 'telefone']) || [];
		for (let i = 0; i < familiar.length; i++) {
			const f = familiar[i];
			try {
				if (f.nome || f.relacao || f.email || f.tele) { // check if amiliar has anything fulfilled
					if (!f.email) errors.push({ id: 3, indicado: f });
					if (f.email && (f.email === aluna.email)) errors.push({ id: 4, indicado: f });
					f.aluno_id = aluna.id; f.familiar = true;
					await DB.upsertIndicado(f);
				}
			} catch (error) {
				help.sentryError(`Erro ao salvar familiar ${f.id} `, { familiar: f, error });
			}
		}

		await addQueue.addNewNotificationIndicados(aluna.id, aluna.turma_id, true);

		// joining indicados and saving answer
		let answers = indicacao.concat(familiar);
		answers = await aux.addCustomParametersToAnswer(answers, response.custom_variables);

		await DB.upsertAtividade(aluna.id, 'atividade_indicacao', answers);
		if (errors && errors.length > 0) {
			const eMailToSend = await help.getMailAdmin();
			const eMailText = await help.getIndicacaoErrorText(errors, aluna);
			let html = await fs.readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
			html = await html.replace('[CONTEUDO_MAIL]', eMailText);
			await mailer.sendHTMLMail(`Alertas na indicação da Aluna ${aluna.nome_completo}`, eMailToSend, html, null, eMailText);
		}
	} catch (error) {
		help.sentryError('Erro em saveIndicados', error);
	}
}

/**
 * @description Saves the answers from both the indicados_questionarios (avaliador360pre or avaliador360pos)
 * @param {string} surveyName The name of the survey being answered (from questionario table), we use it to find the name of the column
 * @param {integer} indicadoID ID of the indicado this answer belongs to
 * @param {json} answer the formated answer
 * @returns {string} description of execution result
 */
async function saveAvaliacao360(surveyName, indicadoID, answer) {
	try {
		const columnName = { avaliador360pre: 'pre', avaliador360pos: 'pos' };
		const res = await DB.upsertIndicadosRespostas(indicadoID, columnName[surveyName], answer);
		if (res && res.id) return `Salvou ${surveyName} com sucesso!`;
		throw new Error({ msg: 'Erro ao salvar avaliação 360', err: res });
	} catch (error) {
		help.sentryError('Erro em saveIndicados', error);
		return 'Erro em saveIndicados';
	}
}


module.exports = {
	saveIndicados, saveAvaliacao360,
};
