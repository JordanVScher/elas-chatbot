require('dotenv').config();
const { parseAsync } = require('json2csv');

const help = require('../helper');
const db = require('../DB_helper');

async function getAlunoTurmaCSV(turma) {
	const alunas = await db.getAlunasReport(turma);

	if (!alunas || alunas.length === 0) { return { error: 'Sem alunos nessa turma.' }; }
	console.log(alunas);

	const result = await parseAsync(alunas, { includeEmptyRows: true }).then(csv => csv).catch(err => err);
	if (!result) { help.Sentry.captureMessage('Erro interno!'); return { error: 'erro no parse' }; }

	return { content: await Buffer.from(result, 'utf8'), filename: `${await help.getTimestamp()}_Turma_${turma}.csv` };
}


module.exports = { getAlunoTurmaCSV };
