const { parseAsync } = require('json2csv');
const turmas = require('../../server/models').turma;
const db = require('../DB_helper');
const help = require('../helper');
const { missingAnswersWarning } = require('../flow');
const { sendHTMLMail } = require('../mailer');
const { sendWarning } = require('../broadcast');

const eMailToSend = process.env.ENV === 'prod' ? process.env.EMAILMENTORIA : process.env.MAILDEV;

const columnCSV = {
	turma: 'Turma',
	modulo: 'Módulo',
	aluno_id: 'ID Aluna',
	nome_aluno: 'Nome Aluna',
	telefone: 'Telefone Aluna',
	email: 'E-mail Aluna',
	cpf: 'CPF Aluna ',
	indicado_id: 'ID Avaliador',
	indicado_nome: 'Nome Avaliador',
	indicado_telefone: 'Telefone Avaliador',
	indicado_mail: 'E-mail Avaliador',
	atividade_indicacao: 'Indicação de Avaliadores (Avaliação 360)',
	atividade_aluno_pre: 'Pré Sondagem de foco',
	atividade_aluno_pos: 'Pós Sondagem de foco',
	atividade_indicado_pre: 'Pré Avaliação 360 (Avaliador)',
	atividade_indicado_pos: 'Pós Avaliação 360 (Avaliador)',
};

// which questionarios should be answered by the time the new modulo starts
const atividadesRules = {
	1: { aluno: ['atividade_indicacao', 'atividade_aluno_pre'], indicado: ['atividade_indicado_pre'] },
	2: {},
	3: { aluno: ['atividade_aluno_pos'], indicado: ['atividade_indicado_pos'] },
};

// get only modules that match the warnDaysBefore rule
async function getValidModulos(warnDaysBefore = 2, test) {
	const allTurmas = await turmas.findAll({ where: {}, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em turmas.findAll', err));
	const result = [];
	const today = new Date(); today.setHours(0, 0, 0, 0);
	const a = help.moment();

	allTurmas.forEach((turma) => {
		[1, 2, 3].forEach((moduloN) => {
			const aux = turma[`modulo${moduloN}`];
			if (aux) {
				aux.setHours(0, 0, 0, 0);
				const b = help.moment(aux);
				const diff = a.diff(b, 'days');
				if (test || (!test && diff === warnDaysBefore)) {
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

// get alunos that havent answered the questionarios from that modulo
async function getMissingAnswers(users, moduloN) {
	const missingAnswer = [];
	const rule = atividadesRules[moduloN];

	// check if aluno didnt answer the atividade yet and add aluno once to missing answer
	users.forEach((user) => {
		Object.keys(user).forEach((key) => {
			const currentRule = user.indicado_id ? rule.indicado : rule.aluno;
			if (key.includes('atividade')) { // we care only for "atividade_*"
				// if that atividade is on the modulo's rule and it's empty we add it to the "missing" key
				if (currentRule && currentRule.includes(key)) {
					if (user[key]) {
						user[key] = 'Respondido';
					} else {
						user[key] = 'Não Respondido';
						user.modulo = moduloN; // save the modulo the user is in
					}
				} else {
					user[key] = null; // no use for this atividade because it's not a part of the rule, answered or not
				}
			}
		});
		if (user.modulo) missingAnswer.push(user);
	});

	return missingAnswer;
}

async function formatDataToCSV(lines, CSV) {
	lines.forEach((line) => {
		Object.keys(CSV).forEach((key) => {
			if (line[key] || line[key] === null || line[key] === '' || line[key] === false) {
				line[CSV[key]] = line[key];
				delete line[key];
			} else {
				line[CSV[key]] = null;
			}
		});
	});

	return lines;
}

async function GetWarningData(modulos) {
	let missingAnswers = [];

	for (let i = 0; i < modulos.length; i++) {
		const modulo = modulos[i];
		const alunos = await db.getAlunaRespostasWarning(modulo.turmaID);
		const indicados = await db.getIndicadoRespostasWarning(modulo.turmaID);
		const users = alunos.concat(indicados);
		const aux = await getMissingAnswers(users, modulo.moduloN);

		if (aux && aux.length > 0) {
			missingAnswers = [...missingAnswers, ...aux];
		}
	}

	return formatDataToCSV(missingAnswers, columnCSV);
}

async function sendWarningCSV(test = false) {
	const modulos = await getValidModulos(2, test);
	const content = await GetWarningData(modulos);
	if (content && content.length > 0) {
		const result = await parseAsync(content, { includeEmptyRows: true }).then((csv) => csv).catch((err) => err);
		const csv = { content: await Buffer.from(result, 'utf8'), filename: `${await help.getTimestamp()}_FALTA_RESPONDER.csv`, contentType: 'text/csv' };
		await sendHTMLMail(missingAnswersWarning.mailSubject, eMailToSend, missingAnswersWarning.mailText, [csv]);
		await sendWarning(csv);
	}
}


module.exports = { sendWarningCSV };
