const turmas = require('../../server/models').turma;
const db = require('../DB_helper');
const { sentryError } = require('../helper');
const { moment } = require('../helper');


// which questionarios should be answered by the time the new modulo starts
const atividadesRules = {
	1: { aluno: ['atividade_indicacao', 'atividade_aluno_pre'], indicado: ['atividade_indicado_pre'] },
	2: {},
	3: { aluno: ['atividade_aluno_pos'], indicado: ['atividade_indicado_pos'] },
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
		aluno.module = moduloN; aluno.missing = [];
		Object.keys(aluno).forEach((key) => {
			if (key.includes('atividade')) { // we care only for "atividade_*"
			// if that atividade is on the modulo's rule and it's empty we add it to the "missing" key
				if (rule.aluno.includes(key) && !aluno[key]) aluno.missing.push(key);
				delete aluno[key]; // no more use for this atividade, answered or not
			}
		});
		if (aluno.missing && aluno.missing.length > 0) missingAnswer.push(aluno);
	});

	// same thing as above but with indicado
	indicados.forEach((indicado) => {
		indicado.module = moduloN; indicado.missing = [];
		Object.keys(indicado).forEach((key) => {
			if (key.includes('atividade')) {
				if (rule.indicado.includes(key) && !indicado[key]) indicado.missing.push(key);
				delete indicado[key];
			}
		});
		if (indicado.missing && indicado.missing.length > 0) missingAnswer.push(indicado);
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
		console.log(indicados);

		const aux = await getMissingAnswers(alunos, indicados, modulo.moduloN);
		if (aux && aux.length > 0) missingAnswers = [...missingAnswers, ...aux];
	}

	return missingAnswers;
}
