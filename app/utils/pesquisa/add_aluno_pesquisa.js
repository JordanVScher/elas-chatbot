// pesquisa: after the last module, alunos become part of the "pesquisa"
const { Op } = require('sequelize');
const { alunos } = require('../../server/models');
const { turma } = require('../../server/models');
const pesquisa = require('../../server/models').aluno_pesquisa;
const pData = require('./pesquisa_data');


// after the third module has passed (and before the first broadcast), add the alunos of the turma
async function addAlunosPesquisa() {
	const today = new Date();
	const limitDate = new Date();
	if (process.env.ENV === 'homol') {
		limitDate.setDate(limitDate.getDate() + 30);
	} else {
		limitDate.setMonth(limitDate.getMonth() + pData.limitMonths);
	}

	// get turmas that end between today and the first broadcast
	const turmas = await turma.findAll({ where: { modulo3: { [Op.gte]: today, [Op.lte]: limitDate } }, raw: true });

	if (turmas && turmas.length > 0) {
		for (let i = 0; i < turmas.length; i++) {
			const t = turmas[i];
			if (process.env.ENV === 'homol') { t.modulo3.setDate(t.modulo3.getDate() + 6); }
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

module.exports = {
	addAlunosPesquisa,
};
