const { CronJob } = require('cron');
const { sentryError } = require('./helper');
const { sendWarningCSV } = require('./admin_menu/warn_admin');
const { sendWarningAlunas } = require('./admin_menu/warn_aluna');
const send = require('./notificationSendQueue');
const { updateTurmas } = require('./turma');
const { addAlunosPesquisa } = require('./pesquisa/add_aluno_pesquisa');
const { sendPesquisa } = require('./pesquisa/send_pesquisa_broadcast');
const { syncRespostas } = require('./surveys/questionario_sync');
const { sendSyncRespostasReport } = require('./mailer');

const { getChatbotData } = require('../chatbot_api');
const { sendHTMLMail } = require('./mailer');

async function checkAPI() {
	try {
		const res = await getChatbotData(process.env.PAGE_ID);
		if (!res || !res.id) {
			const txt = `Chatbot: Elas\n\nAmbiente: ${process.env.ENV}\n\nErro: A api do Assistente Cívico CAIU\n\nEndereço: ${process.env.MANDATOABERTO_API_URL}`;
			if (process.env.ENV !== 'local') await sendHTMLMail(`ERRO - API do Assistente Cívico CAIU ${process.env.ENV}`, process.env.MAILDEV, txt, null, txt);
		}
	} catch (e) {
		sentryError('Error on checkAPI', e);
	}
}

const sendMissingWarningCron = new CronJob(
	'00 30 8 * * *', async () => {
		console.log('Running sendMissingWarningCron');
		try {
			await sendWarningCSV(false);
		} catch (error) {
			console.log('sendMissingWarningCron error', error);
			await sentryError('Error on sendMissingWarningCron', error);
		}
	}, (() => { console.log('Crontab sendMissingWarningCron stopped.'); }),
	true, 'America/Sao_Paulo', false, false,
);

const sendWarningAlunasCron = new CronJob(
	'00 40 8 * * *', async () => {
		console.log('Running sendWarningAlunasCron');
		try {
			await sendWarningAlunas(false);
		} catch (error) {
			console.log('sendWarningAlunasCron error', error);
			await sentryError('Error on sendWarningAlunasCron', error);
		}
	}, (() => { console.log('Crontab sendWarningAlunasCron stopped.'); }),
	true, 'America/Sao_Paulo', false, false,
);

const sendNotificationCron = new CronJob(
	'00 00 7-22/1 * * *', async () => {
		console.log('Running sendNotificationCron');
		try {
			const queue = await send.getQueue();
			await send.sendNotificationFromQueue(queue);
		} catch (error) {
			console.log('sendNotificationFromQueue error', error);
			await sentryError('Error on sendNotificationFromQueue', error);
		}
	}, (() => { console.log('Crontab sendNotificationCron stopped.'); }),
	true, 'America/Sao_Paulo', false, false,
);

const updateTurmasCron = new CronJob(
	'00 00 00 * * *', async () => {
		console.log('Running updateTurmas');
		try {
			await updateTurmas();
		} catch (error) {
			console.log('updateTurmasCron error', error);
			await sentryError('Error on updateTurmasCron', error);
		}
	}, (() => { console.log('Crontab updateTurmas stopped.'); }),
	true, 'America/Sao_Paulo', false, false,
);

const addPesquisasCron = new CronJob(
	'00 00 09 * * *', async () => {
		console.log('Running addPesquisasCron');
		try {
			await addAlunosPesquisa();
		} catch (error) {
			console.log('addPesquisasCron error', error);
			await sentryError('Error on addPesquisasCron', error);
		}
	}, (() => {	console.log('Crontab addPesquisasCron stopped.'); }),
	true, 'America/Sao_Paulo', false, false,
);

const sendPesquisasCron = new CronJob(
	'00 30 09 * * *', async () => {
		console.log('Running sendPesquisasCron');
		try {
			await sendPesquisa();
		} catch (error) {
			console.log('sendPesquisasCron error', error);
			await sentryError('Error on sendPesquisasCron', error);
		}
	}, (() => {	console.log('Crontab sendPesquisasCron stopped.'); }),
	true,	'America/Sao_Paulo', false, false,
);

const checkAPICron = new CronJob(
	'00 30 * * * *', async () => {
		console.log('Running checkAPICron');
		try {
			await checkAPI();
		} catch (error) {
			console.log('checkAPICron error', error);
			await sentryError('Error on checkAPICron', error);
		}
	}, (() => { console.log('Crontab checkAPICron stopped.'); }),
	true,	'America/Sao_Paulo', false, false,
);

const syncRespostasCron = new CronJob(
	'00 15 7 * * *', async () => {
		console.log('Running syncRespostasCron');
		try {
			const res = await syncRespostas();
			await sendSyncRespostasReport(res);
		} catch (error) {
			console.log('syncRespostasCron error', error);
			await sentryError('Error on syncRespostasCron', error);
		}
	}, (() => { console.log('Crontab syncRespostasCron stopped.'); }),
	true,	'America/Sao_Paulo', false, false,
);

async function cronLog() {
	console.log(`Crontab sendNotificationCron is running? => ${sendNotificationCron.running}`);
	console.log(`Crontab sendWarningAlunasCron is running? => ${sendWarningAlunasCron.running}`);
	console.log(`Crontab updateTurmasCron is running? => ${updateTurmasCron.running}`);
	console.log(`Crontab sendMissingWarningCron is running? => ${sendMissingWarningCron.running}`);
	console.log(`Crontab addPesquisasCron is running? => ${addPesquisasCron.running}`);
	console.log(`Crontab sendPesquisasCron is running? => ${sendPesquisasCron.running}`);
	console.log(`Crontab checkAPICron is running? => ${checkAPICron.running}`);
	console.log(`Crontab syncRespostasCron is running? => ${syncRespostasCron.running}`);
}

module.exports = { cronLog };
