require('dotenv').config();
const { parseAsync } = require('json2csv');
const request = require('request-promise');
const { csv2json } = require('csvjson-csv2json');
const help = require('../helper');
const { getTurmaName } = require('./../DB_helper');
const { addNewNotificationAlunas } = require('./../notificationAddQueue');
const notificationQueue = require('../../server/models').notification_queue;


async function buildCSV(data, texts) {
	if (!data || !data.content || data.content.length === 0) { return { error: texts.error }; }
	const result = await parseAsync(data.content, { includeEmptyRows: true }).then(csv => csv).catch(err => err);
	if (!result) { help.Sentry.captureMessage('Erro no parse!'); return { error: 'Erro no parse!' }; }
	const newFilename = texts.filename.replace('<INPUT>', await getTurmaName(data.input));
	return { csvData: await Buffer.from(result, 'utf8'), filename: `${await help.getTimestamp()}_${newFilename}.csv` };
}

async function getJsonFromURL(url) {
	const csvData = await request.get(url, (error, response, body) => body);
	try {
		if (csvData) {
			const json = csv2json(csvData, { parseNumbers: true });
			if (json) { return json; }
			return false;
		}
		return false;
	} catch (error) {
		return false;
	}
}

async function getFeedbackMsgs(addedALunos, errors) {
	// addedALunos => csvLines.length - errors.length
	const result = [];

	if (addedALunos === 0) {
		result.push('Nenhuma aluna foi adicionada!');
	} else if (addedALunos === 1) {
		result.push('Uma aluna foi adicionada!');
	} else {
		result.push(`${addedALunos} alunas foram adicionadas!`);
	}

	if (errors.length === 1) {
		result.push(`Ocorreu 1 erro na linha ${errors[0]}`);
	} else if (errors.length > 1) {
		result.push(`Ocorreram ${errors.length} erros. Nas linhas ${errors.join(', ').replace(/,(?=[^,]*$)/, ' e')}.`);
	}

	return result;
}

// updates (or creates) notifications in queue when the aluna changes the turma
async function NotificationChangeTurma(alunaID, turmaID) {
	const userNotifications = await notificationQueue.findAll({ where: { aluno_id: alunaID }, raw: true }).then(res => res).catch(err => help.sentryError('Erro em notificationQueue.findAll', err));
	if (!userNotifications || userNotifications.length === 0) {
		await addNewNotificationAlunas(alunaID, turmaID);
	} else {
		userNotifications.forEach((notification) => { // update notification onlywhen it hasnt already been sent and the turma differs
			if ((!notification.sent_at && !notification.error) && notification.turma_id !== turmaID) {
				notificationQueue.update({ turma_id: turmaID }, { where: { id: notification.id } })
					.then(rowsUpdated => rowsUpdated).catch(err => help.sentryError('Erro no update do notificationQueue', err));
			}
		});
	}
}


module.exports = {
	buildCSV, getJsonFromURL, getFeedbackMsgs, NotificationChangeTurma,
};
