const { CronJob } = require('cron');
const { readFileSync } = require('fs');
const help = require('./helper');
const db = require('./DB_helper');
const mailer = require('./mailer');
const emails = require('./emails');
const broadcast = require('./broadcast');
const { buildIndicadoChart } = require('./sm_help');
const { buildAlunoChart } = require('./sm_help');

// for each turma get the alunas in them
async function getAlunasFromTurmas(turmas) {
	const result = [];

	for (let i = 0; i < turmas.length; i++) {
		const element = turmas[i];
		if (element.turma) {
			const aux = await db.getAlunasFromTurma(element.turma);
			aux.forEach((element2) => {
				const extendedAluna = element2; // add more information for each aluna
				extendedAluna.mod1 = element['módulo1'];
				extendedAluna.mod2 = element['módulo2'];
				extendedAluna.mod3 = element['módulo3'];
				extendedAluna.local = element.local;
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
async function getIndicadosFromAlunas(alunas, familiar) {
	const result = [];
	// for each turma get the alunas in them
	for (let i = 0; i < alunas.length; i++) {
		const element = alunas[i];
		if (element.id) {
			const aux = await db.getIndicadoFromAluna(element.id, familiar);
			aux.forEach((element2) => {
				const extendedIndicado = element2; // add more information for each aluna
				extendedIndicado.nomeAluna = element.nome_completo;
				extendedIndicado.mod1 = element.mod1;
				extendedIndicado.mod2 = element.mod2;
				extendedIndicado.mod3 = element.mod3;
				extendedIndicado.local = element.local;
				result.push(extendedIndicado);
			});
		}
	}

	return result || [];
}

// uses each obj in data to replace keywords/mask on the text with the correct data
async function replaceDataText(original, data) {
	let text = original;
	data.forEach(async (element) => {
		if (element.mask && element.data) {
			const regex = new RegExp(`\\[${element.mask}\\]`, 'g');
			text = text.replace(regex, element.data);
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
	Add objs with key mask and no data to replaceMap, used in the mail handlers below.
*/
async function fillMasks(replaceMap, alunaData) {
	const result = replaceMap;

	for (let i = 0; i < replaceMap.length; i++) {
		const element = replaceMap[i];
		if (element.mask && !element.data) { // check which value is expected to be filled now
			let newData = '';
			switch (element.mask) {
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
			default:
				break;
			}

			result[i].data = newData;
		}
	}

	return result;
}


async function sendRelatorios(mail, aluna, html) {
	const pdf = { filename: `${aluna.cpf}_360Results.pdf` };
	const { filename } = await buildIndicadoChart(aluna.cpf); // actually path
	pdf.content = filename || false;

	const png = { filename: `${aluna.cpf}_sondagem.png` };
	png.content = await buildAlunoChart(aluna.cpf); // actually buffer

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
async function handleAlunaMail(spreadsheet, today, days, paramName, mail, replaceMap = []) {
	try {
		const alunas = await getAlunasFromModule(spreadsheet, today, days, paramName);

		alunas.forEach(async (element) => { // here we can format the e-mails
			replaceMap.push({ mask: 'NOMEUM', data: element.nome_completo });
			const newMap = await fillMasks(replaceMap, element);

			let text = await replaceDataText(mail.text, newMap); // build e-mail text
			text = await replaceCustomParameters(text, element.turma, element.cpf, '');

			let html = await readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
			html = await html.replace('[CONTEUDO_MAIL]', text); // add nome to mail template
			if (mail.files !== true) {
				await mailer.sendHTMLMail(mail.subject, element.email, html, mail.anexo);

				if (element.fb_id && mail.chatbotText) { // if aluna is linked with messenger we send a message to the bot
					let newText = await replaceDataText(mail.chatbotText, newMap); // build chatbot text
					newText = await replaceCustomParameters(newText, element.turma, element.cpf, '');

					await broadcast.sendBroadcastAluna(element.fb_id, newText, mail.chatbotButton);
					if (mail.chatbotCard) { await broadcast.sendCardAluna(element.fb_id, mail.chatbotCard, element.cpf); }
				}
			} else { // for case mail 13
				await sendRelatorios(mail, element, html);
			}
		});
	} catch (error) {
		console.log('Erro em handleAlunaMail', error); // helper.Sentry.captureMessage('Erro em handleAtividadeOne');
	}
}

/* Get indicados, their data and send the e-mails. Check getAlunasFromModule and getIndicadosFromAlunas.
	mail: obj with the original text, subject and attachment
	familiar: if true we get only the indicados that are familiar
	replaceMap: map with data to replace on the text
*/
async function handleIndicadoMail(spreadsheet, today, days, paramName, mail, familiar, replaceMap) {
	try {
		const alunas = await getAlunasFromModule(spreadsheet, today, days, paramName);
		const indicados = await getIndicadosFromAlunas(alunas, familiar);
		indicados.forEach(async (element) => { // here we can format the e-mails
			const newSubject = mail.subject.replace('[NOMEUM]', element.nomeAluna);
			replaceMap.push({ mask: 'NOMEUM', data: element.nomeAluna });
			const newMap = await fillMasks(replaceMap, element);

			let text = await replaceDataText(mail.text, newMap);
			text = await replaceCustomParameters(text, '', '', element.id);
			// console.log('-------------------\nto', element.email, '\n', text);

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

	// await handleAlunaMail(spreadsheet, today, 19, 'módulo1', emails.mail1, [
	// 	{ mask: 'GRUPOWHATS', data: process.env.GRUPOWHATSAP },
	// 	{ mask: 'LINKDONNA', data: process.env.LINK_DONNA },
	// 	{ mask: 'MODULO1', data: '' },
	// 	{ mask: 'LOCAL', data: '' },
	// 	{ mask: 'FDSMOD1', data: '' },
	// 	{ mask: 'FDSMOD2', data: '' },
	// 	{ mask: 'FDSMOD3', data: '' },
	// ]);
	// await handleAlunaMail(spreadsheet, today, 19, 'módulo1', emails.mail2, [
	// 	{ mask: 'SONDAGEMPRE', data: process.env.SONDAGEM_PRE_LINK },
	// 	{ mask: 'INDICACAO360', data: process.env.INDICACAO360_LINK },
	// 	{ mask: 'DISC_LINK', data: process.env.DISC_LINK1 },
	// 	{ mask: 'LINKDONNA', data: process.env.LINK_DONNA },
	// 	{ mask: 'TURMA', data: '' },
	// 	{ mask: 'MOD1_15DIAS', data: '' },
	// 	{ mask: 'MOD1_2DIAS', data: '' },
	// ]);
	// await handleIndicadoMail(spreadsheet, today, 10, 'módulo1', emails.mail3, false, [
	// 	{ mask: 'AVALIADORPRE', data: process.env.AVALIADOR360PRE_LINK },
	// 	{ mask: 'MOD1_2DIAS', data: '' },
	// ]);
	// await handleAlunaMail(spreadsheet, today, 10, 'módulo1', emails.mail4, [
	// 	{ mask: 'AVALIADORPRE', data: process.env.AVALIADOR360PRE_LINK },
	// 	{ mask: 'MOD1_2DIAS', data: '' },
	// ]);
	// await handleAlunaMail(spreadsheet, today, -5, 'módulo1', emails.mail5, [{ mask: 'AVALIACAO1', data: process.env.MODULO1_LINK }]);
	// await handleAlunaMail(spreadsheet, today, 12, 'módulo2', emails.mail6, [{ mask: 'LINKDONNA', data: process.env.LINK_DONNA }]);
	// await handleAlunaMail(spreadsheet, today, -5, 'módulo2', emails.mail7, [
	// 	{ mask: 'EMAILMENTORIA', data: process.env.EMAILMENTORIA },
	// 	{ mask: 'MOD3_LASTDAY', data: '' },
	// 	{ mask: 'MOD3_2DIAS', data: '' },
	// ]);
	// await handleAlunaMail(spreadsheet, today, -5, 'módulo2', emails.mail8, [{ mask: 'AVALIACAO2', data: process.env.MODULO2_LINK }]);
	// await handleAlunaMail(spreadsheet, today, 12, 'módulo3', emails.mail9, [
	// 	{ mask: 'SONDAGEMPOS', data: process.env.SONDAGEM_POS_LINK },
	// 	{ mask: 'DISC_LINK', data: process.env.DISC_LINK2 },
	// 	{ mask: 'TURMA', data: '' },
	// 	{ mask: 'MOD3_7DIAS', data: '' },
	// ]);
	// await handleIndicadoMail(spreadsheet, today, 12, 'módulo3', emails.mail10, false, [
	// 	{ mask: 'AVALIADORPOS', data: process.env.AVALIADOR360POS_LINK },
	// 	{ mask: 'MOD3_7DIAS', data: '' }]);
	// await handleAlunaMail(spreadsheet, today, 12, 'módulo3', emails.mail11, [
	// 	{ mask: 'AVALIADORPOS', data: process.env.AVALIADOR360POS_LINK },
	// 	{ mask: 'MOD3_LASTDAY', data: '' },
	// 	{ mask: 'MOD3_7DIAS', data: '' },
	// ]);
	// await handleIndicadoMail(spreadsheet, today, 12, 'módulo3', emails.mail12, true, [
	// 	{ mask: 'NUMBERWHATSAP', data: process.env.NUMBERWHATSAP },
	// 	{ mask: 'MOD3_LASTDAY', data: '' },
	// ]);
	// await handleAlunaMail(spreadsheet, today, 1, 'módulo3', emails.mail13, [{ mask: 'AVALIACAO3', data: process.env.MODULO3_LINK }]);
	// await handleAlunaMail(spreadsheet, today, -5, 'módulo3', emails.mail14, [{ mask: 'AVALIACAO3', data: process.env.MODULO3_LINK }]);
}

test();

const FirstTimer = new CronJob(
	'00 00 8 * * 1-6', async () => { // 8h except on sundays
		console.log('Running FirstTimer');
		const spreadsheet = await help.getFormatedSpreadsheet();
		const d = new Date(Date.now()); const today = help.moment(d);
		await handleAlunaMail(spreadsheet, today, 242, 'módulo1', emails.mail1);
	}, (() => {
		console.log('Crontab FirstTimer stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo', false,
	false, // runOnInit = true useful only for tests
);


module.exports = {
	FirstTimer, handleIndicadoMail, handleAlunaMail,
};
