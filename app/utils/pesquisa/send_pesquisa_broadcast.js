// pesquisa: for alunos in pesquisa, send message with links every PESQUISA_MONTHS months
// everytime a pesquisa_broadcast is sent, the next date will be updated thanks to the increment on msgsEnviadas
const { CronJob } = require('cron');
const { Op } = require('sequelize');
const { readFileSync } = require('fs');
const help = require('../helper');
const flow = require('../flow');
const mailer = require('../mailer');
const broadcast = require('../broadcast');
const pesquisa = require('../../server/models').aluno_pesquisa;
const { alunos } = require('../../server/models');

const broadcastStep = process.env.PESQUISA_MONTHS;

const pesquisaLinks = {
	1: 'foobar1',
	2: 'foobar2',
	3: 'foobar3',
	4: 'foobar4',
};

/**
 * calculates the next date and checks if today is a valid day to send the next pesquisa broadcast
 * @param {string} today - today's date
 * @param {string} aluno - aluno_pesquisa row
 * @return {boolean} valid pesquisa to send or not
 */
async function checkSendPesquisa(today, aluno) {
	const nextMessage = aluno.msgsEnviadas + 1; // number of PESQUISA_MONTHS steps to take after the dataInicial
	const dateToSend = aluno.dataInicial;
	dateToSend.setMonth(dateToSend.getMonth() + (broadcastStep * nextMessage)); // next date

	const todayMoment = help.moment(today);
	const dateToSendMoment = help.moment(dateToSend);

	if (todayMoment.diff(dateToSendMoment, 'days') >= 0) return true; // if today happens at or after the next date
	return false;
}

/**
 * get data from aluno_pesquisa that havent sent all the broadcast messages yet
 * @return {array} aluno_pesquisa rows that passed the date validation
 */
async function getAlunosToSend() {
	const alunosToSend = [];
	const today = new Date();
	const alunosMightSend = await pesquisa.findAll({ where: { msgsEnviadas: { [Op.lte]: Object.keys(pesquisaLinks).length } }, raw: true }).then(res => res).catch(err => help.sentryError('Erro em getAlunosToSend.findAll', err));

	alunosMightSend.forEach((aluno) => {
		if (checkSendPesquisa(today, aluno) !== true) {
			alunosToSend.push(aluno);
		}
	});

	return alunosToSend;
}

/**
 * get the actual aluno data and add pesquisa details to it
 * @param {array} alunosToSend - aluno_pesquisa rows
 * @return {array} alunos with pesquisa details
 */
async function prepareAlunosToSend(alunosToSend) {
	const result = [];
	for (let i = 0; i < alunosToSend.length; i++) {
		const e = alunosToSend[i];
		const aluno = await alunos.findByPk(e.alunoID, { raw: true, include: ['chatbot'] }).then(res => res).catch(err => help.sentryError('Erro em prepareAlunosToSend.findOne', err));
		aluno.newMessage = e.msgsEnviadas + 1; // the new number to update on msgsEnviadas
		aluno.text = flow.pesquisa.textMsg.replace('<LINK_PESQUISA>', pesquisaLinks[aluno.newMessage]); // the text to be sent
		result.push(aluno);
	}
	return result;
}

/**
 * sends the e-mail and facebook broadcasts
 * @param {array} sent - alunos with pesquisa details
 */
async function broadcastPesquisa(toSend) {
	const result = [];
	const baseHtml = await readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
	for (let i = 0; i < toSend.length; i++) {
		const e = toSend[i];
		e.error = {};
		const html = baseHtml.replace('[CONTEUDO_MAIL]', e.text);
		const mailError = await mailer.sendHTMLMail(`Pesquisa ${e.newMessage}`, e.email, html);
		if (mailError) e.error.mail = mailError.toString();

		if (e['chatbot.fb_id']) {
			const chatbotError = await broadcast.sendBroadcastAluna(e['chatbot.fb_id'], e.text);
			if (chatbotError) e.error.chatbot = `\n${chatbotError.toString()}`;
		}

		result.push(e);
	}

	return result;
}

/**
 * update aluno_pesquisa for next broadcast
 * @param {array} sent - alunos with pesquisa details that received the broadcast
 */
async function updatePesquisa(sent) { // eslint-disable-line
	for (let i = 0; i < sent.length; i++) {
		const e = sent[i];
		const toUpdate = { msgsEnviadas: e.newMessage, error: e.error };
		if (e.error && e.error.mail && e.error.chatbot) delete toUpdate.msgsEnviadas;
		await pesquisa.update(toUpdate, { where: { alunoID: e.id } })
			.then(rowsUpdated => rowsUpdated).catch(err => help.sentryError('Erro no updatePesquisa2', err));
	}
}


async function sendPesquisa() {
	let alunosToSend = await getAlunosToSend();
	alunosToSend = await prepareAlunosToSend(alunosToSend);
	alunosToSend = await broadcastPesquisa(alunosToSend);
	await updatePesquisa(alunosToSend);
}

const sendPesquisasCron = new CronJob(
	'00 30 00 * * *', async () => {
		console.log('Running sendPesquisasCron');
		try {
			await sendPesquisa();
		} catch (error) {
			await help.sentryError('Error on sendPesquisasCron', error);
		}
	}, (() => {
		console.log('Crontab sendPesquisasCron stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo', false,
	false, // runOnInit = true useful only for tests
);

module.exports = {
	sendPesquisasCron,
};
