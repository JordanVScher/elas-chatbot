// pesquisa: for alunos in pesquisa, send message with links every PESQUISA_MONTHS months
// everytime a pesquisa_broadcast is sent, the next date will be updated thanks to the increment on msgsEnviadas
const { readFileSync } = require('fs');
const help = require('../helper');
const flow = require('../flow');
const mailer = require('../mailer');
const broadcast = require('../broadcast');
const pesquisa = require('../../server/models').aluno_pesquisa;
const { alunos } = require('../../server/models');
const pData = require('./pesquisa_data');

const broadcastStep = process.env.PESQUISA_MONTHS;

/**
 * calculates the next date and checks if today is a valid day to send the next pesquisa broadcast
 * @param {string} today - today's date
 * @param {string} pAluno - aluno_pesquisa row
 * @return {boolean} valid pesquisa to send or not
 */
async function checkSendPesquisa(today, pAluno) {
	const nextMessage = pAluno.msgsEnviadas + 1; // number of PESQUISA_MONTHS steps to take after the dataInicial
	const dateToSend = new Date(pAluno.dataInicial); dateToSend.setHours(0, 0, 0, 0);

	if (process.env.ENV === 'homol') {
		dateToSend.setDate(dateToSend.getDate() + (2 * nextMessage)); // next date
	} else {
		dateToSend.setMonth(dateToSend.getMonth() + (broadcastStep * nextMessage)); // next date
	}

	const todayMoment = help.moment(today);
	const dateToSendMoment = help.moment(dateToSend);

	// if msgsEnviadas is the same length as the amount of links we have actually sent, there's no more more links to send
	const linksSent = Object.values(pAluno.linksEnviados);
	if (pAluno.msgsEnviadas >= linksSent.length) return false;
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
	const alunosMightSend = await pesquisa.findAll({ where: {}, raw: true }).then((res) => res).catch((err) => help.sentryError('Erro em getAlunosToSend.findAll', err));

	for (let i = 0; i < alunosMightSend.length; i++) {
		const aluno = alunosMightSend[i];
		if (await checkSendPesquisa(today, aluno) === true) { // !== for easy testing
			alunosToSend.push(aluno);
		}
	}


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
		const aluno = await alunos.findByPk(e.alunoID, { raw: true, include: ['chatbot'] }).then((res) => res).catch((err) => help.sentryError('Erro em prepareAlunosToSend.findOne', err));
		aluno.newMessage = e.msgsEnviadas + 1; // the new number to update on msgsEnviadas
		aluno.text = flow.pesquisa.textMsg.replace('<LINK_PESQUISA>', pData.pesquisaLinksObj[aluno.newMessage]); // the text to be sent
		aluno.links = await pData.updateLinksObj(e.linksEnviados, pData.pesquisaLinksObj[aluno.newMessage]);
		result.push(aluno);
	}
	return result;
}

/**
 * sends the e-mail and facebook broadcasts
 * @param {array} toSend - alunos with pesquisa details
 */
async function broadcastPesquisa(toSend) {
	const result = [];
	const baseHtml = await readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
	for (let i = 0; i < toSend.length; i++) {
		const e = toSend[i];
		e.error = {};
		if (e.email && e.email.trim()) {
			const html = baseHtml.replace('[CONTEUDO_MAIL]', e.text);
			const mailError = await mailer.sendHTMLMail(`Pesquisa ${e.newMessage}`, e.email, html);
			if (mailError) e.error.mail = mailError.toString();
		} else {
			e.error.mail = 'Aluno não tem e-mail';
		}

		if (e['chatbot.fb_id'] && e['chatbot.fb_id'].length > 0) {
			const chatbotError = await broadcast.sendBroadcastAluna(e['chatbot.fb_id'], e.text);
			if (chatbotError) e.error.chatbot = `\n${chatbotError.toString()}`;
		} else {
			e.error.chatbot = 'Aluno não tem fb_id';
		}

		if (Object.keys(e.error).length === 0) {
			result.push(e);
		}
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
		const toUpdate = { msgsEnviadas: e.newMessage, error: e.error, linksEnviados: e.links };
		if (e.error && e.error.mail && e.error.chatbot) delete toUpdate.msgsEnviadas;

		await pesquisa.update(toUpdate, { where: { alunoID: e.id } })
			.then((rowsUpdated) => rowsUpdated).catch((err) => help.sentryError('Erro no updatePesquisa2', err));
	}
}


async function sendPesquisa() {
	let alunosToSend = await getAlunosToSend();
	alunosToSend = await prepareAlunosToSend(alunosToSend);
	alunosToSend = await broadcastPesquisa(alunosToSend);
	await updatePesquisa(alunosToSend);
}

module.exports = {
	checkSendPesquisa, sendPesquisa,
};
