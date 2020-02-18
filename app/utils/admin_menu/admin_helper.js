require('dotenv').config();
const { parseAsync } = require('json2csv');
const request = require('request-promise');
const { csv2json } = require('csvjson-csv2json');
const { Op } = require('sequelize');
const help = require('../helper');
const CSVFormat = require('./CSV_format');
const db = require('./../DB_helper');
const queue = require('./../notificationAddQueue');
const notificationQueue = require('../../server/models').notification_queue;
const turmaChangelog = require('../../server/models').aluno_turma_changelog;
const alunosRespostas = require('../../server/models').alunos_respostas;
const indicadosRespostas = require('../../server/models').indicados_respostas;
const indicados = require('../../server/models').indicacao_avaliadores;
const { turma } = require('../../server/models');
const { alunos } = require('../../server/models');
const { checkUserOnLabel } = require('../../utils/postback');
const { adminMenu } = require('../../utils/flow');
const rules = require('../notificationRules');
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
async function NotificationChangeTurma(alunaID, oldTurmaID, newturmaID) {
	// check if aluno was on a regular turma and was transered to in company or the opposite
	const oldInCompany = await db.getTurmaInCompany(oldTurmaID);
	const newInCompany = await db.getTurmaInCompany(newturmaID);

	if (oldInCompany === newInCompany || !newturmaID || !oldTurmaID) { // aluna didnt change turma type or aluna was removed (newturmaID || oldTurmaID = null)
		const userNotifications = await notificationQueue.findAll({ where: { aluno_id: alunaID, error: null, sent_at: null }, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em notificationQueue.findAll', err));
		if ((!userNotifications || userNotifications.length === 0) && newturmaID) { // if aluna doesnt have any notification to be sent we add them in like normal
			// await queue.addNewNotificationAlunas(alunaID, newturmaID);
			// await queue.addNewNotificationIndicados(alunaID, newturmaID);
		} else {
			userNotifications.forEach((n) => { // update notification only when it hasnt already been sent and the turma differs
				if ((!n.error && !n.sent_at) && n.turma_id !== newturmaID) { // simply update the turma_id of the ones that havent been sent yet
					let error = null;
					if (!newturmaID) { error = { msg: 'Removida da turma', date: new Date() }; }
					notificationQueue.update({ turma_id: newturmaID, error }, { where: { id: n.id } })
						.then((rowsUpdated) => rowsUpdated).catch((err) => help.sentryError('Erro no update do notificationQueue', err));
				}
			});
		}
	} else { // aluna changed type of turma!
		const userNotifications = await notificationQueue.findAll({ where: { aluno_id: alunaID, error: null, sent_at: null }, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em notificationQueue.findAll', err));
		if ((!userNotifications || userNotifications.length === 0) && newturmaID) { // if aluna doesnt have any notifications we add them in like normal
			await queue.addNewNotificationAlunas(alunaID, newturmaID);
			await queue.addNewNotificationIndicados(alunaID, newturmaID);
		} else {
			let shouldAdd = true;
			for (let i = 0; i < userNotifications.length; i++) {
				const n = userNotifications[i]; // update notification only when it hasnt already been sent and the turma differs, adding an error msg
				if ((!n.error && !n.sent_at) && n.turma_id !== newturmaID) { // which turns OFF notification of the older turma
					notificationQueue.update({ error: { msg: `User changed from ${oldInCompany ? '"in company"' : '"regular turma"'} to ${newInCompany ? '"in company"' : '"regular turma"'}`, date: new Date() } }, { where: { id: n.id } })
						.then((rowsUpdated) => rowsUpdated).catch((err) => help.sentryError('Erro no update do notificationQueue', err));
				}

				// after "turning off" the notifications from the older turma, we must add all notifications for the newer turma
				if ((!n.error && !n.sent_at) && n.turma_id === newturmaID) { // if we find at least one notification from the new turma that hasn't been sent
					shouldAdd = false; // DONT add new notification for the newer turma
				}
			}
			if (shouldAdd) {
				await queue.addNewNotificationAlunas(alunaID, newturmaID);
				await queue.addNewNotificationIndicados(alunaID, newturmaID);
			}
		}
	}
}

// from the CSV, adds notification for new indicados and updates status of familiar notifications
async function updateNotificationIndicados(indicadosLines) {
	try {
		for (let i = 0; i < indicadosLines.length; i++) {
			const indicado = indicadosLines[i];

			const userNotifications = await notificationQueue.findAll({ where: { indicado_id: indicado.id }, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em notificationQueue.findAll', err));
			const turmaID = await db.getTurmaIdFromAluno(indicado.aluno_id);
			// load the correct notification rules, based on the In Company turma status
			const inCompany = await db.getTurmaInCompany(turmaID);
			const familiarType = inCompany ? 28 : 12; // the type_id of the familiar notification
			let rulesIndicados = await rules.loadTabNotificationRules(inCompany);
			rulesIndicados = await rulesIndicados.filter((x) => x.indicado === true); // only rules for indicados

			for (let j = 0; j < rulesIndicados.length; j++) {
				const rule = rulesIndicados[j];
				const foundNotification = await userNotifications.find((x) => x.notification_type === rule.notification_type);
				if (!foundNotification && turmaID) { // add new notification only when it doesnt exist, even if user wasnt familiar before
					await queue.addAvaliadorOnQueue(rule, indicado, turmaID);
				}
			}

			if (indicado.familiar !== true) { // if user is no longer familiar we update the error column
				// obs: postgresql wont update a column that doesnt exist so we won't "update" the notification of an user that wasnt a familiar in the first place
				await db.updateIndicadoNotification(indicado.id, familiarType, 'Não é mais familiar, foi atualizado no csv do admin');
			} else if (indicado.familiar === true) {
				await db.updateIndicadoNotification(indicado.id, familiarType, null);
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
		if (line['Avaliação Módulo 1']) line['Avaliação Módulo 1'] = true;
		if (line['Avaliação Módulo 2']) line['Avaliação Módulo 2'] = true;
		if (line['Avaliação Módulo 3']) line['Avaliação Módulo 3'] = true;
		if (line.Cadastro) line.Cadastro = true;

		const newLine = {};
		await Object.keys(line).forEach(async (element) => {
			if (line[element] === true) {
				newLine[element] = replament;
			} else if (!line[element]) {
				newLine[element] = 'Não Respondido';
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

// Turma was updated and changed types, every notification from this turma gets turned off with an error msg
// Every aluno and indicado from the turma get new notifications
async function updateNotificationTurma(turmaID) {
	const inCompany = await db.getTurmaInCompany(turmaID);

	let msg = '';
	if (inCompany === true) {
		msg = 'Turma changed type from regular turma to In Company';
	} else {
		msg = 'Turma changed type from In Company to regular turma';
	}

	const turmaNotifications = await notificationQueue.findAll({ where: { turma_id: turmaID, error: null, sent_at: null }, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em notificationQueue.findAll', err));
	for (let i = 0; i < turmaNotifications.length; i++) {
		const n = turmaNotifications[i];
		notificationQueue.update({ error: { msg, date: new Date() } }, { where: { id: n.id } })
			.then((rowsUpdated) => rowsUpdated).catch((err) => help.sentryError('Erro no update do notificationQueue-turma', err));
	}

	const turmaAlunos = await alunos.findAll({ where: { turma_id: turmaID }, raw: true }).then((r) => r).catch((err) => help.sentryError('Erro no findAll do alunos', err));

	for (let i = 0; i < turmaAlunos.length; i++) {
		const a = turmaAlunos[i];
		await queue.addNewNotificationAlunas(a.id, turmaID);
		await queue.addNewNotificationIndicados(a.id, turmaID);
	}
}


async function getStatusData(turmaID) {
	const results = [];
	const alunosTurma = await alunos.findAll({ where: { turma_id: turmaID }, attributes: ['id', 'nome_completo', 'cpf', 'email', 'created_at'], raw: true }).then((r) => r).catch((err) => console.log(err));
	const notifications = await notificationQueue.findAll({ where: { turma_id: turmaID, indicado_id: null }, raw: true }).then((r) => r).catch((err) => console.log(err));
	const alunosID = alunosTurma.map((x) => x.id);
	const respostas = await alunosRespostas.findAll({ where: { aluno_id: alunosID }, raw: true }).then((r) => r).catch((err) => console.log(err));
	const toAnswer = ['atividade_1', 'pre', 'pos', 'atividade_indicacao', 'avaliacao_modulo1', 'avaliacao_modulo2', 'avaliacao_modulo3'];
	const regras = await rules.loadTabNotificationRules(false);

	for (let i = 0; i < alunosTurma.length; i++) {
		const aux = alunosTurma[i];

		const alunaResposta = respostas.find((x) => x.aluno_id === aux.id);
		toAnswer.forEach((e) => {
			const resp = alunaResposta && alunaResposta[e] ? alunaResposta[e] : null;
			if (resp) {
				aux[e] = resp.answer_date ? `Respondido em ${resp.answer_date}` : 'Respondido';
			} else {
				aux[e] = 'Não Respondido';
			}
		});

		const alunaQueue = notifications.filter((x) => x.aluno_id === aux.id);
		regras.forEach((e) => {
			if (!e.indicado) {
				if (alunaQueue && alunaQueue.length > 0) {
					const n = alunaQueue.find((x) => x.notification_type === e.notification_type);
					if (n) {
						if (n.sent_at && !n.error) {
							aux[`notificacao${e.notification_type}`] = n.sent_at;
						} else if (n.error) {
							aux[`notificacao${e.notification_type}`] = JSON.stringify(n.error);
						} else {
							aux[`notificacao${e.notification_type}`] = 'Ainda não foi enviada';
						}
					} else {
						aux[`notificacao${e.notification_type}`] = 'Não tem na fila';
					}
				} else {
					aux[`notificacao${e.notification_type}`] = 'Não tem na fila';
				}
			}
		});

		results.push(aux);
	}

	return results;
}

async function getStatusDataIndicados(turmaID) {
	const results = [];
	const indicadosTurma = await indicados.findAll({
		include: [
			{
				model: alunos, as: 'aluna', where: { turma_id: turmaID }, attributes: ['id', 'nome_completo', 'cpf'],
			},
			{ model: indicadosRespostas, as: 'respostas', attributes: ['pre', 'pos'] },
		],
		attributes: ['id', 'nome', 'email', 'familiar', 'created_at'],
		raw: true,
	}).then((r) => r).catch((err) => err);
	const notifications = await notificationQueue.findAll({ where: { turma_id: turmaID, indicado_id: { [Op.ne]: null } }, raw: true }).then((r) => r).catch((err) => console.log(err));

	const regras = await rules.loadTabNotificationRules(false);

	for (let i = 0; i < indicadosTurma.length; i++) {
		const aux = indicadosTurma[i];

		aux['respostas.pre'] = aux['respostas.pre'] !== null ? 'Respondido' : 'Não respondido';
		aux['respostas.pos'] = aux['respostas.pos'] !== null ? 'Respondido' : 'Não respondido';

		const indicadoQueue = notifications.filter((x) => x.indicado_id === aux.id && !x.check_answered);

		regras.forEach((e) => {
			if (e.indicado) {
				if (indicadoQueue && indicadoQueue.length > 0) {
					const n = indicadoQueue.find((x) => x.notification_type === e.notification_type);
					if (n) {
						if (n.sent_at && !n.error) {
							aux[`notificacao${e.notification_type}`] = n.sent_at;
						} else if (n.error) {
							aux[`notificacao${e.notification_type}`] = JSON.stringify(n.error);
						} else {
							aux[`notificacao${e.notification_type}`] = 'Ainda não foi enviada';
						}
					} else {
						aux[`notificacao${e.notification_type}`] = 'Não tem na fila';
					}
				} else {
					aux[`notificacao${e.notification_type}`] = 'Não tem na fila';
				}
			}
		});


		results.push(aux);
	}

	return results;
}

async function anotherCSV(data, filename) {
	const result = await parseAsync(data, { includeEmptyRows: true }).then((csv) => csv).catch((err) => err);
	return { csvData: await Buffer.from(result, 'utf8'), filename };
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
	updateNotificationTurma,
	getStatusData,
	getStatusDataIndicados,
	anotherCSV,
};
