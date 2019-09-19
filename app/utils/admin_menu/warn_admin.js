const turmas = require('../../server/models').turma;
const db = require('../DB_helper');
const { sentryError } = require('../helper');
const { moment } = require('../helper');


// which questionarios should be answered by the time the new modulo starts
const atividadesRules = {
	1: { aluno: ['atividade_indicacao', 'aluno_pre'], avaliador: ['indicado_pre'] },
	2: {},
	3: { aluno: ['aluno_pos'], avaliador: ['indicado_pos'] },
};

const warnDaysBefore = 2;

// get only modules that match the warnDaysBefore rule
async function getValidModulos() {
	const allTurmas = await turmas.findAll({ where: {}, raw: true }).then(res => res).catch(err => sentryError('Erro em turmas.findAll', err));
	const result = [];
	const today = new Date(); today.setHours(0, 0, 0, 0);
	const a = moment();

	allTurmas.forEach((turma) => {
		[1, 2, 3].forEach((moduloN) => {
			const aux = turma[`modulo${moduloN}`];
			if (aux) {
				aux.setHours(0, 0, 0, 0);
				const b = moment(aux);
				const diff = a.diff(b, 'days');
				if (diff === warnDaysBefore) {
					result.push({
						turmaID: turma.id,
						moduloN,
						moduloDate: turma[`modulo${moduloN}`],
					});
				}
			}
		});
	});

	return result;
}

// get alunos that havent answered the questionarios from that module
async function getMissingAnswers(alunos, indicados, moduloN) {
	const missingAnswer = [];
	const rule = atividadesRules[moduloN];

	// check if aluno didnt answer the atividade yet and add aluno once to missing answer
	alunos.forEach((aluno) => {
		let added = false;
		rule.aluno.forEach((atividade) => {
			if (!aluno[atividade] && !added) {
				aluno.module = moduloN;
				missingAnswer.push(aluno);
				added = true;
			}
		});
	});

	indicados.forEach((indicado) => {
		let added = false;
		rule.avaliador.forEach((atividade) => {
			if (!indicado[atividade] && !added) {
				indicado.module = moduloN;
				missingAnswer.push(indicado);
				added = true;
			}
		});
	});

	return missingAnswer;
}

async function GetWarningData() {
	let missingAnswers = [];
	const modulos = await getValidModulos();
	for (let i = 0; i < modulos.length; i++) {
		const modulo = modulos[i];
		const alunos = await db.getAlunaRespostasWarning(modulo.turmaID);
		const indicados = await db.getIndicadoRespostasWarning(modulo.turmaID);

		const aux = await getMissingAnswers(alunos, indicados, modulo.moduloN);
		if (aux && aux.length > 0) missingAnswers = [...missingAnswers, ...aux];
	}

	return missingAnswers;
}
