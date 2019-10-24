// pesquisa: after the last module, alunos become part of the "pesquisa"
const { CronJob } = require('cron');
const { Op } = require('sequelize');
const { alunos } = require('../../server/models');
const { turma } = require('../../server/models');
const pesquisa = require('../../server/models').aluno_pesquisa;
const { sentryError } = require('../helper');
const pData = require('./pesquisa_data');


// after the third module has passed (and before the first broadcast), add the alunos of the turma
async function addAlunosPesquisa() {
	const today = new Date();
	const limitDate = new Date();
	console.log(limitDate);

	limitDate.setMonth(limitDate.getMonth() + pData.limitMonths);
	// get turmas that end between today and the first broadcast
	const turmas = await turma.findAll({ where: { modulo3: { [Op.gte]: today, [Op.lte]: limitDate } }, raw: true });
	console.log(turmas);
	if (turmas && turmas.length > 0) {
		for (let i = 0; i < turmas.length; i++) {
			const t = turmas[i];
			const alunas = await alunos.findAll({ where: { turma_id: t.id }, raw: true });
			for (let j = 0; j < alunas.length; j++) {
				const a = alunas[j];
				const emptyLinks = {}; Object.keys(pData.pesquisaLinksObj).forEach((e) => { emptyLinks[e] = ''; }); // create empty links obj (number of keys = msgs to send)
				await pesquisa.findOrCreate({
					where: { alunoID: a.id },
					defaults: {
						alunoID: a.id, msgsEnviadas: 0, dataInicial: t.modulo3, linksEnviados: emptyLinks,
					},
				});
			}
		}
	}
}

const addPesquisasCron = new CronJob(
	'00 00 00 * * *', async () => {
		console.log('Running addPesquisasCron');
		try {
			await addAlunosPesquisa();
		} catch (error) {
			await sentryError('Error on addPesquisasCron', error);
		}
	}, (() => {
		console.log('Crontab addPesquisasCron stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo', false,
	false, // runOnInit = true useful only for tests
);

module.exports = {
	addPesquisasCron,
};
