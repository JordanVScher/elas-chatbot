const turmas = require('../../server/models').turma;
const { sentryError } = require('../helper');
const { moment } = require('../helper');


// which questionarios should be answered by the time the new modulo starts
const atividadesRules = {
	1: { aluna: ['atividade_indicacao', 'pre'], avaliador: ['pre'] },
	2: {},
	3: { aluna: ['atividade_modulo2', 'pos'], avaliador: ['pos'] },
};

const warnDaysBefore = 2;

// get only modules that match the warnDaysBefore rule
async function getValidModules() {
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
						modulo: moduloN,
						moduloDate: turma[`modulo${moduloN}`],
						turmaID: turma.id,
					});
				}
			}
		});
	});

	return result;
}

getValidModules(getValidModules);
