const { CronJob } = require('cron');
const help = require('./helper');
const db = require('./DB_helper');
const mailer = require('./mailer');
const emails = require('./emails');
const broadcast = require('./broadcast');

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
		if (diff === days) { // find the turma(s) that matches the criteria
			getTurmas.push(element);
		}
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
			text = text.replace(`<${element.mask}>`, element.data);
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

/* Get alunas, their data and send the e-mails. Check getAlunasFromModule.
	mail: obj with the original text, subject and attachment
	replaceMap: map with data to replace on the text
*/
async function handleAlunaMail(spreadsheet, today, days, paramName, mail, replaceMap = []) {
	const alunas = await getAlunasFromModule(spreadsheet, today, days, paramName);
	alunas.forEach(async (element) => { // here we can format the e-mails
		let text = await replaceDataText(mail.text, replaceMap);
		text = await replaceCustomParameters(text, element.turma, element.cpf, '');
		console.log('-------------------\nto', element.email, '\n', text);
		await mailer.sendTestMail(mail.subject, text, element.email);
		if (element.fb_id) { // if aluna is linked with messenger we send a message to the bot
			await broadcast.sendBroadcastAluna(element.fb_id, mail.subject);
		}
	});
}

/* Get indicados, their data and send the e-mails. Check getAlunasFromModule and getIndicadosFromAlunas.
	mail: obj with the original text, subject and attachment
	familiar: if true we get only the indicados that are familiar
	replaceMap: map with data to replace on the text
*/
async function handleIndicadoMail(spreadsheet, today, days, paramName, mail, familiar, replaceMap) {
	const alunas = await getAlunasFromModule(spreadsheet, today, days, paramName);
	const indicados = await getIndicadosFromAlunas(alunas, familiar);
	indicados.forEach(async (element) => { // here we can format the e-mails
		let text = await replaceDataText(mail.text, replaceMap);
		text = await replaceCustomParameters(text, '', '', element.id);
		console.log('-------------------\nto', element.email, '\n', text);
		await mailer.sendTestMail(mail.subject, text, element.email);
	});
}

// async function test() {
// 	const spreadsheet = await help.getFormatedSpreadsheet();
// 	const d = new Date(Date.now());	const today = help.moment(d);
// 	await handleAlunaMail(spreadsheet, today, 19, 'módulo1', emails.mail1, [{ mask: 'GRUPOWHATS', data: process.env.GRUPOWHATSAP }]);
// 	await handleAlunaMail(spreadsheet, today, 19, 'módulo1', emails.mail2, [
// 		{ mask: 'ATIVIDADE1', data: process.env.ATIVIDADE1_LINK },
// 		{ mask: 'INDICACAO360', data: process.env.INDICACAO360_LINK },
// 		{ mask: 'ATIVIDADE2', data: process.env.ATIVIDADE2_LINK },
// 		{ mask: 'DISC_LINK', data: process.env.DISC_LINK1 },
// 	]);
// 	await handleIndicadoMail(spreadsheet, today, 10, 'módulo1', emails.mail3, false, [{ mask: 'AVALIADORPRE', data: process.env.AVALIADOR360PRE_LINK }]);
// 	await handleAlunaMail(spreadsheet, today, 10, 'módulo1', emails.mail4, [{ mask: 'AVALIADORPRE', data: process.env.AVALIADOR360PRE_LINK }]);
// 	await handleAlunaMail(spreadsheet, today, -5, 'módulo1', emails.mail5, [{ mask: 'AVALIACAO1', data: process.env.MODULO1_LINK }]);
// 	await handleAlunaMail(spreadsheet, today, 12, 'módulo2', emails.mail6, []);
// 	await handleAlunaMail(spreadsheet, today, -5, 'módulo2', emails.mail7, []);
// 	await handleAlunaMail(spreadsheet, today, -5, 'módulo2', emails.mail8, [{ mask: 'AVALIACAO2', data: process.env.MODULO2_LINK }]);
// 	await handleAlunaMail(spreadsheet, today, 12, 'módulo3', emails.mail9, [
// 		{ mask: 'SONDAGEMPOS', data: process.env.SONDAGEM_POS_LINK },
// 		{ mask: 'DISC_LINK', data: process.env.DISC_LINK2 },
// 	]);
// 	await handleIndicadoMail(spreadsheet, today, 12, 'módulo3', emails.mail10, false, [{ mask: 'AVALIADORPOS', data: process.env.AVALIADOR360POS_LINK }]);
// 	await handleAlunaMail(spreadsheet, today, 12, 'módulo3', emails.mail11, [{ mask: 'AVALIADORPOS', data: process.env.AVALIADOR360POS_LINK }]);
// 	await handleIndicadoMail(spreadsheet, today, 12, 'módulo3', emails.mail12, true, [{ mask: 'NUMBERWHATSAP', data: process.env.NUMBERWHATSAP }]);
// 	await handleAlunaMail(spreadsheet, today, -5, 'módulo3', emails.mail13, [{ mask: 'AVALIACAO3', data: process.env.MODULO3_LINK }]);
// }


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
