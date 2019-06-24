const { CronJob } = require('cron');
const help = require('./helper');
const db = require('./DB_helper');
const mailer = require('./mailer');
const emails = require('./emails');

async function handleFirstTimer(spreadsheet, days, paramName, mail) {
	const d = new Date(Date.now());
	const today = help.moment(d);

	const module1 = await spreadsheet.filter(x => x[paramName]);
	const getTurmas = [];

	module1.forEach((element) => {
		const mod1Date = help.moment(element[paramName]);
		const diff = mod1Date.diff(today, 'days');
		if (diff === days) { // find the turma that matches the criteria
			getTurmas.push(element);
		}
	});

	const alunas = await db.getAlunasFromTurmas(getTurmas);

	alunas.forEach(async (element) => {
		let text = mail.text.replace('<NOMEUM>', element.nome_completo);
		text = text.replace('<INICIOMODULO1>', element.mod1);
		await mailer.sendTestMail(mail.subject, text, element.email);
	});
}


const FirstTimer = new CronJob(
	'00 00 8 * * 1-6', async () => { // 8h except on sundays
		const spreadsheet = await help.getFormatedSpreadsheet();
		await handleFirstTimer(spreadsheet, 243, 'módulo1', emails.mail1);
	}, (() => {
		console.log('Crontab FirstTimer stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo', false,
	false, // runOnInit = true useful only for tests
);


module.exports = {
	FirstTimer,
};
