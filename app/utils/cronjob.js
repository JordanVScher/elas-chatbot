const { CronJob } = require('cron');
const { readFileSync } = require('fs');
const help = require('./helper');
const db = require('./DB_helper');
const mailer = require('./mailer');
const emails = require('./emails');
const broadcast = require('./broadcast');
const charts = require('./charts');
const teste = require('./sendNotificationQueue');

// for each turma get the alunas in them
async function getAlunasFromTurmas(turmas) {
	const result = [];

	for (let i = 0; i < turmas.length; i++) {
		const element = turmas[i];
		if (element.turma) {
			const aux = await db.getAlunasFromTurma(element.turma);
			aux.forEach((element2) => {
				const extendedAluna = element2; // add more information for each aluna
				if (element['módulo1']) { extendedAluna.mod1 = element['módulo1']; }
				if (element['módulo2']) { extendedAluna.mod2 = element['módulo2']; }
				if (element['módulo3']) { extendedAluna.mod3 = element['módulo3']; }
				if (element.local) { extendedAluna.local = element.local; }
				if (element.moduloAvisar) { extendedAluna.moduloAvisar = element.moduloAvisar; }
				if (element.dataHora) { extendedAluna.dataHora = element.dataHora; }
				result.push(extendedAluna);
			});
		}
	}
	return result || [];
}


/* Gets the alunas that match the e-mail criteria. Returns array with alunas data.
	spreadsheet: data from the turma spreadsheet
	today: today date as a "moment"
	days: the difference between today and the day the module starts. Positive numbers = days before, negative numbers = days after
	paramName: the module that triggers the mail
*/
async function getAlunasFromModule(spreadsheet, today, days, paramName) {
	const getTurmas = [];
	const modulex = await spreadsheet.filter(x => x[paramName]); // get turmas that have this param name (ex: módulo1)

	modulex.forEach((element) => {
		const modxDate = help.moment(element[paramName]); // get when that module starts
		const diff = modxDate.diff(today, 'days');
		// if (diff === days) { // find the turma(s) that matches the criteria
		getTurmas.push(element);
		// }
	});

	const alunas = await getAlunasFromTurmas(getTurmas);
	return alunas || [];
}

/*
	Gets the indicados from each aluna. Returns array with indicados data.
	alunas: array with alunas data
	familiar: if true we get only the indicados that are familiar
*/
async function getIndicadosFromAlunas(alunas, familiar, pre, pos) {
	const result = [];
	// for each turma get the alunas in them
	for (let i = 0; i < alunas.length; i++) {
		const element = alunas[i];
		if (element.id) {
			const aux = await db.getIndicadoFromAluna(element.id, familiar, pre, pos);
			aux.forEach((element2) => {
				const extendedIndicado = element2; // add more information for each aluna
				if (element.nome_completo) { extendedIndicado.nomeAluna = element.nome_completo; }
				if (element.mod1) { extendedIndicado.mod1 = element.mod1; }
				if (element.mod2) { extendedIndicado.mod1 = element.mod2; }
				if (element.mod3) { extendedIndicado.mod1 = element.mod3; }
				if (element.local) { extendedIndicado.mod1 = element.local; }
				result.push(extendedIndicado);
			});
		}
	}

	return result || [];
}

// uses each key in data to replace globally keywords/mask on the text with the correct data
async function replaceDataText(original, data) {
	let text = original;
	Object.keys(data).forEach(async (element) => {
		if (data[element] && data[element].length > 0) {
			const regex = new RegExp(`\\[${element}\\]`, 'g');
			text = text.replace(regex, data[element]);
		}
	});

	return text;
}

async function replaceCustomParameters(original, turma, alunaCPF, indicadoID) {
	let text = original;

	if (text.includes('turma=TURMARESPOSTA')) {
		if (turma && turma.toString().length > 0) {
			text = text.replace(/TURMARESPOSTA/g, turma);
		} else {
			text = text.replace('turma=TURMARESPOSTA', '');
		}
	}

	if (text.includes('cpf=CPFRESPOSTA')) {
		if (alunaCPF && alunaCPF.toString().length > 0) {
			text = text.replace(/CPFRESPOSTA/g, alunaCPF);
		} else {
			text = text.replace('cpf=CPFRESPOSTA', '');
		}
	}

	if (text.includes('indicaid=IDRESPOSTA')) {
		if (indicadoID && indicadoID.toString().length > 0) {
			text = text.replace(/IDRESPOSTA/g, indicadoID);
		} else {
			text = text.replace('indicaid=IDRESPOSTA', '');
		}
	}

	return text;
}
/*
	fillMasks: checks which data is empty so that we can fill with dynamic data.
	Used in the mail handlers below.
*/
async function fillMasks(replaceMap, alunaData) {
	const result = replaceMap;
	const mapKeys = Object.keys(replaceMap);

	for (let i = 0; i < mapKeys.length; i++) {
		const currentKey = mapKeys[i];

		if (!result[currentKey]) { // check if that key has no value already
			let newData = '';
			switch (currentKey) {
			case 'MODULO1':
				newData = await help.formatModulo1(alunaData.mod1);
				break;
			case 'LOCAL':
				newData = alunaData.local;
				break;
			case 'FDSMOD1':
				newData = await help.formatFdsMod(alunaData.mod1);
				break;
			case 'FDSMOD2':
				newData = await help.formatFdsMod(alunaData.mod2);
				break;
			case 'FDSMOD3':
				newData = await help.formatFdsMod(alunaData.mod3);
				break;
			case 'TURMA':
				newData = alunaData.turma;
				break;
			case 'MOD1_15DIAS':
				newData = await help.formatDiasMod(alunaData.mod1, -15);
				break;
			case 'MOD1_2DIAS':
				newData = await help.formatDiasMod(alunaData.mod1, -2);
				break;
			case 'MOD3_LASTDAY':
				newData = await help.formatDiasMod(alunaData.mod3, 1);
				break;
			case 'MOD3_2DIAS':
				newData = await help.formatDiasMod(alunaData.mod3, -2);
				break;
			case 'MOD3_7DIAS':
				newData = await help.formatDiasMod(alunaData.mod3, -7);
				break;
			case 'MODULOAVISAR':
				newData = alunaData.moduloAvisar ? alunaData.moduloAvisar.toString() : 'novo';
				break;
			case 'DATAHORA':
				newData = await help.formatModuloHora(alunaData.dataHora);
				break;
			case 'ATIVIDADESCOMPLETAS':
				newData = help.atividadesCompletas[alunaData.moduloAvisar];
				break;
			default:
				break;
			}

			result[currentKey] = newData;
		}
	}

	return result;
}


async function sendRelatorios(mail, aluna, html) {
	const pdf = { filename: `${aluna.cpf}_360Results.pdf` };
	const { filename } = await charts.buildIndicadoChart(aluna.cpf); // actually path
	pdf.content = filename || false;

	const png = { filename: `${aluna.cpf}_sondagem.png` };
	png.content = await charts.buildAlunoChart(aluna.cpf); // actually buffer

	await mailer.sendHTMLFile(mail.subject, aluna.email, html, pdf, png); // send both attachments to e-mail
	const newText = mail.chatbotText.replace('[NOMEUM]', aluna.nome_completo);
	if (await broadcast.sendBroadcastAluna(aluna.fb_id, newText, mail.chatbotButton) === true) { // check if first message was sent successfully
		await broadcast.sendFiles(aluna.fb_id, pdf, png);
	}
}

/* Get alunas, their data and send the e-mails. Check getAlunasFromModule.
	mail: obj with the original text, subject and attachment
	replaceMap: map with data to replace on the text
*/
async function handleAlunaMail(spreadsheet, today, days, paramName, mail, originalMap = []) {
	try {
		const replaceMap = originalMap;
		const alunas = await getAlunasFromModule(spreadsheet, today, days, paramName);

		for (let i = 0; i < alunas.length; i++) {
			const element = alunas[i];
			replaceMap.NOMEUM = element.nome_completo; // this mask is always necessary, so it's here by default

			const newMap = await fillMasks(replaceMap, element);
			let text = await replaceDataText(mail.text, newMap); // build e-mail text
			text = await replaceCustomParameters(text, element.turma, element.cpf, '');

			let html = await readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
			html = await html.replace('[CONTEUDO_MAIL]', text); // add nome to mail template
			if (mail.files !== true) {
				if (element.email) {
					await mailer.sendHTMLMail(mail.subject, element.email, html, mail.anexo);
				}

				if (element.fb_id && mail.chatbotText) { // if aluna is linked with messenger we send a message to the bot
					let newText = await replaceDataText(mail.chatbotText, newMap); // build chatbot text
					newText = await replaceCustomParameters(newText, element.turma, element.cpf, '');

					await broadcast.sendBroadcastAluna(element.fb_id, newText, mail.chatbotButton);
					if (mail.chatbotCard) { await broadcast.sendCardAluna(element.fb_id, mail.chatbotCard, element.cpf); }
				}
			} else { // for case mail 13
				await sendRelatorios(mail, element, html);
			}
		}
	} catch (error) {
		console.log('Erro em handleAlunaMail', error); // helper.Sentry.captureMessage('Erro em handleAtividadeOne');
	}
}

/* Get indicados, their data and send the e-mails. Check getAlunasFromModule and getIndicadosFromAlunas.
	mail: obj with the original text, subject and attachment
	familiar: if true we get only the indicados that are familiar
	replaceMap: map with data to replace on the text
*/
async function handleIndicadoMail(spreadsheet, today, days, paramName, mail, familiar, pre, pos, originalMap) {
	try {
		const replaceMap = originalMap;
		const alunas = await getAlunasFromModule(spreadsheet, today, days, paramName);
		const indicados = await getIndicadosFromAlunas(alunas, familiar, pre, pos);
		indicados.forEach(async (element) => { // here we can format the e-mails
			const newSubject = mail.subject.replace('[NOMEUM]', element.nomeAluna); // replace only what we see on the subject line
			replaceMap.NOMEUM = element.nomeAluna; // this mask is always necessary, so it's here by default
			const newMap = await fillMasks(replaceMap, element);

			let text = await replaceDataText(mail.text, newMap);
			text = await replaceCustomParameters(text, '', '', element.id);

			let html = await readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
			html = await html.replace('[CONTEUDO_MAIL]', text); // add nome to mail template

			await mailer.sendHTMLMail(newSubject, element.email, html, mail.anexo);
		});
	} catch (error) {
		console.log('Erro em handleIndicadoMail', error); // helper.Sentry.captureMessage('Erro em handleAtividadeOne');
	}
}


async function test() {
	const spreadsheet = await help.getFormatedSpreadsheet();
	const d = new Date(Date.now());	const today = help.moment(d);
	const mod1Days = 235;
	const mod2Days = 271;
	const mod3Days = 299;
	const minute = 60000 * 5;
	setTimeout(async () => {
		await handleAlunaMail(spreadsheet, today, 10 + mod1Days, 'módulo1', emails.mail1, { // 19
			GRUPOWHATS: process.env.GRUPOWHATSAP,
			LINKDONNA: process.env.LINK_DONNA,
			MODULO1: '',
			LOCAL: '',
			FDSMOD1: '',
			FDSMOD2: '',
			FDSMOD3: '',
		});
	}, minute * 0);
	setTimeout(async () => {
		await handleAlunaMail(spreadsheet, today, 10 + mod1Days, 'módulo1', emails.mail2, { // 19
			SONDAGEMPRE: process.env.SONDAGEM_PRE_LINK,
			INDICACAO360: process.env.INDICACAO360_LINK,
			DISC_LINK: process.env.DISC_LINK1,
			LINKDONNA: process.env.LINK_DONNA,
			TURMA: '',
			MOD1_15DIAS: '',
			MOD1_2DIAS: '',
		});
	}, minute * 1);
	setTimeout(async () => {
		await handleIndicadoMail(spreadsheet, today, 1 + mod1Days, 'módulo1', emails.mail3, false, null, null, { // 10
			AVALIADORPRE: process.env.AVALIADOR360PRE_LINK,
			MOD1_2DIAS: '',
		});
	}, minute * 2);
	setTimeout(async () => {
		await handleAlunaMail(spreadsheet, today, 1 + mod1Days, 'módulo1', emails.mail4, { // 10
			AVALIADORPRE: process.env.AVALIADOR360PRE_LINK,
			MOD1_2DIAS: '',
		});
	}, minute * 3);
	setTimeout(async () => {
		await handleAlunaMail(spreadsheet, today, 2 + mod1Days, 'módulo1', emails.mail5, { AVALIACAO1: process.env.MODULO1_LINK }); // -5
	}, minute * 4);
	setTimeout(async () => {
		await handleAlunaMail(spreadsheet, today, 3 + mod2Days, 'módulo2', emails.mail6, { LINKDONNA: process.env.LINK_DONNA }); // 12
	}, minute * 5);
	setTimeout(async () => {
		await handleAlunaMail(spreadsheet, today, 4 + mod2Days, 'módulo2', emails.mail7, { // -5
			EMAILMENTORIA: process.env.EMAILMENTORIA,
			MOD3_LASTDAY: '',
			MOD3_2DIAS: '',
		});
	}, minute * 6);
	setTimeout(async () => {
		await handleAlunaMail(spreadsheet, today, 5 + mod2Days, 'módulo2', emails.mail8, { AVALIACAO2: process.env.MODULO2_LINK }); // -5
	}, minute * 7);
	setTimeout(async () => {
		await handleAlunaMail(spreadsheet, today, 6 + mod3Days, 'módulo3', emails.mail9, { // 12
			SONDAGEMPOS: process.env.SONDAGEM_POS_LINK,
			DISC_LINK: process.env.DISC_LINK2,
			TURMA: '',
			MOD3_7DIAS: '',
		});
	}, minute * 8);
	setTimeout(async () => {
		await handleIndicadoMail(spreadsheet, today, 7 + mod3Days, 'módulo3', emails.mail10, false, true, null, { // 12
			AVALIADORPOS: process.env.AVALIADOR360POS_LINK,
			MOD3_7DIAS: '',
		});
	}, minute * 9);
	setTimeout(async () => {
		await handleAlunaMail(spreadsheet, today, 8 + mod3Days, 'módulo3', emails.mail11, { // 12
			MOD3_7DIAS: '',
			AVALIADORPOS: process.env.AVALIADOR360POS_LINK,
			MOD3_LASTDAY: '',
		});
	}, minute * 10);
	setTimeout(async () => {
		await handleIndicadoMail(spreadsheet, today, 8 + mod3Days, 'módulo3', emails.mail12, true, null, null, { // 12
			NUMBERWHATSAP: process.env.NUMBERWHATSAP,
			MOD3_LASTDAY: '',
		});
	}, minute * 11);
	setTimeout(async () => {
		await handleAlunaMail(spreadsheet, today, 9 + mod3Days, 'módulo3', emails.mail13, { AVALIACAO3: process.env.MODULO3_LINK }); // 1
	}, minute * 12);
	setTimeout(async () => {
		await handleAlunaMail(spreadsheet, today, 10 + mod3Days, 'módulo3', emails.mail14, { AVALIACAO3: process.env.MODULO3_LINK }); // -5
	}, minute * 13);
}

const FirstTimer = new CronJob(
	'00 00 8-22/1 * * *', async () => { // 8h except on sundays
		console.log('Running FirstTimer');
		// test();
	}, (() => {
		console.log('Crontab FirstTimer stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo', false,
	false, // runOnInit = true useful only for tests
);

async function getAlunasNotiication(spreadsheet, today, hour) {
	const getTurmas = [];
	const hourDiff = hour >= 0 ? hour - 1 : hour + 1;
	const datahoras = ['datahora1', 'datahora2', 'datahora3'];
	const modulex = await spreadsheet.filter(x => x[datahoras[0]] || x[datahoras[1]] || x[datahoras[2]]); // get turmas that have this param name (ex: módulo1)

	modulex.forEach((turma) => {
		datahoras.forEach((coluna, index) => {
			if (turma[coluna]) {
				const auxDate = new Date(turma[coluna]);
				auxDate.setMinutes(0); auxDate.setSeconds(0); auxDate.setMilliseconds(0);
				const modxDate = help.moment(auxDate); // get when that module starts
				const currentHourDiff = modxDate.diff(today, 'hours');
				if (currentHourDiff === hourDiff) { // check if now is exactly 'hourDiff' before modxDate
					getTurmas.push({
						turma: turma.turma, moduloAvisar: index + 1, local: turma.local, dataHora: turma[coluna],
					});
				}
			}
		});
	});
	const alunas = await getAlunasFromTurmas(getTurmas);
	return alunas || [];
}

async function handleNotification(spreadsheet, today, hourDiff, mail, originalMap = []) {
	const replaceMap = originalMap;
	const alunas = await getAlunasNotiication(spreadsheet, today, hourDiff);
	const alunasOnFB = alunas.filter(x => x.fb_id);
	for (let i = 0; i < alunasOnFB.length; i++) {
		const element = alunasOnFB[i];
		replaceMap.NOMEUM = element.nome_completo; // this mask is always necessary, so it's here by default
		const newMap = await fillMasks(replaceMap, element);
		const text = await replaceDataText(mail.chatbotText, newMap); // build e-mail text
		// text = await replaceCustomParameters(text, element.turma, element.cpf, '');
		await broadcast.sendBroadcastAluna(element.fb_id, text, mail.chatbotButton);
	}
}

async function test2() {
	const spreadsheet = await help.getFormatedSpreadsheet();
	const d = new Date(Date.now());	d.setHours(d.getHours() - 3); const today = help.moment(d);

	// await handleNotification(spreadsheet, today, 1, emails.warning1h, {});
	// await handleNotification(spreadsheet, today, -24, emails.warning1h, {});
	// await handleNotification(spreadsheet, today, 24, emails.warning24h, {
	// 	MODULOAVISAR: '', LOCAL: '', DATAHORA: '', ATIVIDADESCOMPLETAS: '',
	// });
	// await handleIndicadoMail(spreadsheet, today, 6, 'módulo1', emails.mail3, false, false, null, {
	// 	AVALIADORPRE: process.env.AVALIADOR360PRE_LINK,
	// 	MOD1_2DIAS: '',
	// });
	// await handleIndicadoMail(spreadsheet, today, 3, 'módulo3', emails.mail10, false, true, false, { // 12
	// 	AVALIADORPOS: process.env.AVALIADOR360POS_LINK,
	// 	MOD3_7DIAS: '',
	// });
}

module.exports = {
	FirstTimer, handleIndicadoMail, handleAlunaMail, test,
};
