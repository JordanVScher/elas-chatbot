require('dotenv').config();
const { parseAsync } = require('json2csv');
const request = require('request-promise');
const { csv2json } = require('csvjson-csv2json');
const help = require('../helper');
const CSVFormat = require('./CSV_format');
const db = require('./../DB_helper');
const { addNewNotificationAlunas } = require('./../notificationAddQueue');
const { addAvaliadorOnQueue } = require('./../notificationAddQueue');
const notificationQueue = require('../../server/models').notification_queue;
const turmaChangelog = require('../../server/models').aluno_turma_changelog;
const { turma } = require('../../server/models');
const { alunos } = require('../../server/models');
const { checkUserOnLabel } = require('../../utils/postback');
const { adminMenu } = require('../../utils/flow');
const { notificationRules } = require('../notificationRules');
const MaAPI = require('../../chatbot_api');
const labels = require('../labels');

async function buildCSV(data, texts) {
	if (!data || !data.content || data.content.length === 0) { return { error: texts.error }; }
	const result = await parseAsync(await CSVFormat.formatBoolean(data.content), { includeEmptyRows: true }).then((csv) => csv).catch((err) => err);
	if (!result) { help.Sentry.captureMessage('Erro no parse!'); return { error: 'Erro no parse!' }; }
	const newFilename = texts.filename.replace('<INPUT>', await db.getTurmaName(data.input));
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

async function checkReceivedFile(context) {
	// for safety reasons we check if the user is an admin again
	if (await checkUserOnLabel(context.session.user.id, process.env.ADMIN_LABEL_ID)) {
		await context.setState({ fileURL: context.event.file.url.replace('https', 'http') });
		await context.setState({ csvLines: await getJsonFromURL(context.state.fileURL) });

		if (context.state.dialog === 'inserirAlunas' || context.state.dialog === 'createAlunos') await context.setState({ dialog: 'createAlunos' });
		if (context.state.dialog === 'inserirAvaliadores' || context.state.dialog === 'createAvaliadores') await context.setState({ dialog: 'createAvaliadores' });
	} else {
		await context.sendText(adminMenu.notAdmin);
		await context.setState({ dialog: 'greetings' });
	}
}

async function getFeedbackMsgs(addedALunos, errors, msgs) {
	// addedALunos => csvLines.length - errors.length
	const result = [];

	if (msgs) {
		if (addedALunos === 0) {
			result.push(msgs[0]);
		} else if (addedALunos === 1) {
			result.push(msgs[1]);
		} else {
			result.push(`${addedALunos} ${msgs[2]}`);
		}
	}

	let messageToSend;
	errors.forEach((element) => {
		if (!messageToSend) messageToSend = 'Erros:';
		messageToSend += `\nLinha ${element.line}: ${element.msg}`;
		if (messageToSend.length >= 1700) {
			result.push(messageToSend);
			messageToSend = null;
		}
	});

	if (messageToSend) result.push(messageToSend);

	return result;
}

async function alunaChangeTurmaLabel(politicianID, pageToken, alunaID, oldTurma, newTurma) {
	const foundUser = await db.getChatbotUser(alunaID);
	if (foundUser && foundUser.cpf) {
		await MaAPI.deleteRecipientLabelCPF(politicianID, foundUser.cpf, oldTurma);
		await MaAPI.postRecipientLabelCPF(politicianID, foundUser.cpf, newTurma);
	}

	if (foundUser && foundUser.fb_id) {
		await labels.unlinkUserToLabelByName(foundUser.fb_id, oldTurma, pageToken);
		await labels.linkUserToLabelByName(foundUser.fb_id, newTurma, pageToken, true);
	}
}

async function SaveTurmaChange(politicianID, pageToken, alunaID, turmaOriginal, turmaNova) {
	if (!turmaOriginal) {
		turmaOriginal = await alunos.findOne({ where: { id: alunaID }, raw: true }).then((res) => res.turma_id).catch((err) => help.sentryError('Erro em alunos.findOne', err)); // eslint-disable-line no-param-reassign
	}

	if (turmaOriginal !== turmaNova) {
		const alunoTurmaOriginal = await turma.findOne({ where: { id: turmaOriginal }, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em turma.findOne', err));
		const moduloOriginal = await help.findModuleToday(alunoTurmaOriginal);
		let alunoTurmaNova = '';
		let moduloNovo = '';
		if (turmaNova) {
			alunoTurmaNova = await turma.findOne({ where: { id: turmaNova }, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em turma.findOne', err));
			moduloNovo = await help.findModuleToday(alunoTurmaNova);
		} else {
			alunoTurmaNova = await db.getTurmaFromID(turmaNova);
			moduloNovo = null;
		}
		turmaChangelog.create({
			alunoID: alunaID, turmaOriginal, turmaNova, moduloOriginal, moduloNovo,
		}).then((res) => res).catch((err) => help.sentryError('Erro em turmaChangelog.create', err));
		await alunaChangeTurmaLabel(politicianID, pageToken, alunaID, alunoTurmaOriginal.nome, alunoTurmaNova.nome);
	}
}


// updates (or creates) notifications in queue when the aluna changes the turma
async function NotificationChangeTurma(alunaID, turmaID) {
	try {
		const userNotifications = await notificationQueue.findAll({ where: { aluno_id: alunaID }, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em notificationQueue.findAll', err));
		if ((!userNotifications || userNotifications.length === 0) && turmaID) {
			await addNewNotificationAlunas(alunaID, turmaID);
		} else {
			userNotifications.forEach((notification) => { // update notification only when it hasnt already been sent and the turma differs
				if ((!notification.sent_at && !notification.error) && notification.turma_id !== turmaID) {
					notificationQueue.update({ turma_id: turmaID }, { where: { id: notification.id } })
						.then((rowsUpdated) => rowsUpdated).catch((err) => help.sentryError('Erro no update do notificationQueue', err));
				}
			});
		}
	} catch (error) {
		help.Sentry.captureMessage('Erro no NotificationChangeTurma!', error);
	}
}

async function updateNotificationIndicados(indicados) {
	try {
		const rulesIndicados = await notificationRules.filter((x) => x.indicado === true);
		for (let i = 0; i < indicados.length; i++) {
			const indicado = indicados[i];

			const userNotifications = await notificationQueue.findAll({ where: { indicado_id: indicado.id }, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em notificationQueue.findAll', err));
			const turmaID = await db.getTurmaIdFromAluno(indicado.aluno_id);

			for (let j = 0; j < rulesIndicados.length; j++) {
				const rule = rulesIndicados[j];

				const foundNotification = await userNotifications.find((x) => x.notification_type === rule.notification_type);
				if (!foundNotification && turmaID) { // add notification every only when it doesnt exist, even if user wasnt familiar before
					await addAvaliadorOnQueue(rule, indicado, turmaID);
				}
			}

			if (indicado.familiar !== true) { // if user is no longer familiar we update the error column
				// obs: postgresql wont update a collumn that doesnt exist so we won't "update" the notification of an user that wasnt a familiar in the first place
				await db.updateIndicadoNotification(indicado.id, 12, 'Não é mais familiar, foi atualizado no csv do admin');
			} else if (indicado.familiar === true) {
				await db.updateIndicadoNotification(indicado.id, 12, null);
			}
		}
	} catch (error) {
		help.Sentry.captureMessage('Erro no updateNotificationIndicados!', error);
	}
}

async function formatRespostasCSV(lines, replament) {
	const result = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line['Sondagem Pré']) line['Sondagem Pré'] = true;
		if (line['Sondagem Pós']) line['Sondagem Pós'] = true;

		const newLine = {};
		await Object.keys(line).forEach(async (element) => {
			if (line[element] === true) {
				newLine[element] = replament;
			} else if (line[element] === false) {
				newLine[element] = '';
			} else {
				newLine[element] = line[element];
			}
		});
		result.push(newLine);
	}

	return result;
}

function buildColumnTurmaChange(log, turmaNames) {
	let result = '';

	if (log.turmaOriginal) {
		result += turmaNames[log.turmaOriginal] || `ID ${log.turmaOriginal}`;
	} else {
		result += 'Sem Turma';
	}
	if (log.moduloOriginal) result += ` (Módulo ${log.moduloOriginal})`;
	result += ' => ';
	if (log.turmaNova) {
		result += turmaNames[log.turmaNova] || `ID ${log.turmaNova}`;
	} else {
		result += 'Sem Turma';
	}
	if (log.moduloNovo) result += ` (Módulo ${log.moduloNovo})`;

	return result;
}

async function addTurmaTransferenceCSV(lines) {
	const newLines = lines;
	const allLogChange = await turmaChangelog.findAll({ where: {}, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em turmaChangelog.findAll', err));
	const turmaDictionary = await db.buildTurmaDictionary();
	const columnTransferenciaText = 'Transferência de Turma';
	let maxTransferences = 0;
	// Add new lines for transferências
	newLines.content.forEach((line) => {
		const alunoTurmaLog = allLogChange.filter((x) => x.alunoID === line.ID);
		alunoTurmaLog.forEach((change, index) => {
			line[`${columnTransferenciaText} ${index + 1}`] = buildColumnTurmaChange(change, turmaDictionary); // eslint-disable-line no-param-reassign
			if (index > maxTransferences) maxTransferences = index + 1;
		});
	});

	// adding columnTransferencia to lines that don't have any value for them (JSON to CSV seems to ignore columns that are not always present)
	newLines.content.forEach((element) => {
		for (let i = 1; i <= maxTransferences; i++) {
			if (!element[`${columnTransferenciaText} ${i}`]) element[`${columnTransferenciaText} ${i}`] = null; // eslint-disable-line no-param-reassign
		}
	});

	return newLines;
}

async function putColumnsLast(lines, columns) {
	lines.forEach((line) => {
		columns.forEach((element) => {
			const aux = line[element];
			if (aux) {
				delete line[element]; // eslint-disable-line no-param-reassign
				line[element] = aux; // eslint-disable-line no-param-reassign
			}
		});
	});

	return lines;
}

module.exports = {
	buildCSV,
	getJsonFromURL,
	getFeedbackMsgs,
	NotificationChangeTurma,
	formatRespostasCSV,
	SaveTurmaChange,
	addTurmaTransferenceCSV,
	putColumnsLast,
	...CSVFormat,
	checkReceivedFile,
	updateNotificationIndicados,
};
