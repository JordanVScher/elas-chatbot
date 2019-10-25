const { CronJob } = require('cron');

const { turma } = require('../server/models');
const help = require('./helper');

// relation of keys from the spreadsheet and the model attributes
const turmaMap = {
	turma: 'nome',
	statusDaTurma: 'status',
	local: 'local',
	pagseguroId: 'pagseguroID',
	datahora1: 'modulo1',
	datahora2: 'modulo2',
	datahora3: 'modulo3',
};

// remove spreadsheet lines that don't match the real turma criteria (we can filter columns here)
async function filerOutInvalidLines(spreadsheet) {
	const validLines = [];
	spreadsheet.forEach((element) => {
		const newElement = element;
		if (newElement.turma && newElement.datahora1 && newElement.datahora2 && newElement.datahora3) {
			validLines.push(newElement);
		}
	});

	return validLines;
}

// adapt the spreadsheet keys to match the model
async function buildQuery(data, map) {
	const result = {};

	Object.keys(data).forEach((element) => {
		const queryInput = map[element];
		if (queryInput && data[element]) {
			result[queryInput] = data[element];
		}
	});

	return result || false;
}

// check which spreadsheet values are different from the values we have saved, the ones that are different will be updated
async function buildUpdateQuery(newData, oldData) {
	const result = {};

	Object.keys(newData).forEach((element) => {
		if (newData[element].toString() !== oldData[element].toString()) {
			result[element] = newData[element];
		}
	});

	return result || false;
}


async function updateTurmas() {
	const spreadsheet = await filerOutInvalidLines(await help.getFormatedSpreadsheet());
	if (spreadsheet && spreadsheet.length > 0) {
		for (const element of spreadsheet) { // eslint-disable-line no-restricted-syntax
			const query = await buildQuery(element, turmaMap);
			if (query) {
				const found = await turma.findOrCreate({ where: { nome: query.nome }, defaults: query }).then(([data, created]) => {
					if (created) { return created; }
					return data.dataValues; // if a new turma wasn't created we might have to update it, so return it
				}).catch(err => help.sentryError('turma findOrCreate', err));
				if (found.id) { // we might need to update it
					const updateQuery = await buildUpdateQuery(query, found);
					if (updateQuery) {
						await turma.update(updateQuery, { where: { id: found.id } }).then(res => res).catch(err => help.sentryError('turma update', err));
					}
				} else if (found === true) { console.log('Added new turma!'); }
			}
		}
	}
}

const updateTurmasCron = new CronJob(
	'00 30 * * * *', async () => {
		console.log('Running updateTurmas');
		await updateTurmas();
	}, (() => {
		console.log('Crontab updateTurmas stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo', false,
	false, // runOnInit = true useful only for tests
);

module.exports = {
	updateTurmas, updateTurmasCron,
};
