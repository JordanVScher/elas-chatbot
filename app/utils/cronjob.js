const { CronJob } = require('cron');
const { sentryError } = require('./helper');
const { sendCSV } = require('./admin_menu/warn_admin.js');
const { sendNotificationFromQueue } = require('./notificationSendQueue');
const { updateTurmas } = require('./turma');
const { addAlunosPesquisa } = require('./pesquisa/add_aluno_pesquisa');
const { sendPesquisa } = require('./pesquisa/send_pesquisa_broadcast');


const sendMissingWarningCron = new CronJob(
	'00 */30 8-22 * * *', async () => {
		console.log('Running sendMissingWarningCron');
		try {
			await sendCSV(false);
		} catch (error) {
			await sentryError('Error on sendMissingWarningCron', error);
		}
	}, (() => {
		console.log('Crontab sendMissingWarningCron stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo', false,
	false, // runOnInit = true useful only for tests
);

const sendNotificationCron = new CronJob(
	'00 00 8-22/1 * * *', async () => {
		console.log('Running sendNotificationCron');
		try {
			await sendNotificationFromQueue();
		} catch (error) {
			await sentryError('Error on sendNotificationFromQueue', error);
		}
	}, (() => {
		console.log('Crontab sendNotificationCron stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo', false,
	false, // runOnInit = true useful only for tests
);

const updateTurmasCron = new CronJob(
	'00 30 * * * *', async () => {
		console.log('Running updateTurmas');
		try {
			await updateTurmas();
		} catch (error) {
			await sentryError('Error on updateTurmasCron', error);
		}
	}, (() => {
		console.log('Crontab updateTurmas stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo', false,
	false, // runOnInit = true useful only for tests
);

const addPesquisasCron = new CronJob(
	'00 00 00 * * *', async () => {
		console.log('Running addPesquisasCron');
		try {
			await addAlunosPesquisa();
		} catch (error) {
			await sentryError('Error on addPesquisasCron', error);
		}
	}, (() => {
		console.log('Crontab addPesquisasCron stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo', false,
	false, // runOnInit = true useful only for tests
);

const sendPesquisasCron = new CronJob(
	'00 30 00 * * *', async () => {
		console.log('Running sendPesquisasCron');
		try {
			await sendPesquisa();
		} catch (error) {
			await sentryError('Error on sendPesquisasCron', error);
		}
	}, (() => {
		console.log('Crontab sendPesquisasCron stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo', false,
	false, // runOnInit = true useful only for tests
);


async function cronLog() {
	console.log(`Crontab sendNotificationCron is running? => ${sendNotificationCron.running}`);
	console.log(`Crontab updateTurmasCron is running? => ${updateTurmasCron.running}`);
	console.log(`Crontab sendMissingWarningCron is running? => ${sendMissingWarningCron.running}`);
	console.log(`Crontab addPesquisasCron is running? => ${addPesquisasCron.running}`);
	console.log(`Crontab sendPesquisasCron is running? => ${sendPesquisasCron.running}`);
}

module.exports = { cronLog };
