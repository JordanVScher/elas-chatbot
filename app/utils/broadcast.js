require('dotenv').config();

const { MessengerClient } = require('messaging-api-messenger');
const { createReadStream } = require('fs');
const { missingAnswersWarning } = require('./flow');
const chatbotUsers = require('../server/models').chatbot_users;
const { sentryError } = require('./helper');

const config = require('../../bottender.config').channels.messenger;

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

async function sendBroadcastAluna(USER_ID, textMsg, buttons) {
	if (USER_ID && USER_ID.toString()) {
		USER_ID = USER_ID.toString();
		const newButtons	= buttons;
		let quickReply = [];
		if (newButtons && newButtons.length > 0) { quickReply = { quick_replies: newButtons }; }

		const error = await client.sendText(USER_ID, textMsg, quickReply).then((resp) => false).catch((err) => { // eslint-disable-line no-unused-vars
			if (err.stack) { console.log(err.stack); return err.stack; }
			console.log(err); return err;
		});

		if (!error) { console.log(`Broadcast sent to ${USER_ID}`);	}
		return error;
	}

	return 'error: no USER_ID';
}

async function sendCardAluna(USER_ID, cards, cpf) {
	if (USER_ID && USER_ID.toString()) {
		USER_ID = USER_ID.toString();
		const elements = [];
		const newCards = JSON.parse(cards);
		newCards.forEach(async (element) => {
			elements.push({
				title: element.title,
				subtitle: element.subtitle,
				image_url: element.image_url,
				default_action: {
					type: 'web_url',
					url: element.url.replace('CPFRESPOSTA', cpf),
				// messenger_extensions: 'false',
				// webview_height_ratio: 'full',
				},
				buttons: [
					{ type: 'web_url', url: element.url.replace('CPFRESPOSTA', cpf), title: 'Fazer Atividade' }],
			});
		});

		const error = await client.sendAttachment(USER_ID, {
			type: 'template',
			payload: {
				template_type: 'generic',
				elements,
			},
		}).then((resp) => false).catch((err) => { // eslint-disable-line no-unused-vars
			if (err.stack) { console.log(err.stack); return err.stack; }
			console.log(err); return err;
		});

		if (!error) { console.log(`Card Broadcast sent to ${USER_ID}`); }
		return error;
	}

	return 'error: no USER_ID';
}

async function sendFiles(USER_ID, pdf, pdf2) {
	if (USER_ID && USER_ID.toString()) {
		USER_ID = USER_ID.toString();
		const error = {};
		if (pdf) {
			error.pdf = await client.sendFile(USER_ID, createReadStream(pdf.content), { filename: pdf.filename })
				.then((resp) => false).catch((err) => { // eslint-disable-line no-unused-vars
					if (err.stack) { console.log(err.stack); return err.stack; }
					console.log(err); return err;
				});
			if (!error.pdf) { console.log('sent resPdf');	}
		}
		if (pdf2) {
			error.pdf2 = await client.sendFile(USER_ID, createReadStream(pdf2.content), { filename: pdf2.filename })
				.then((resp) => false).catch((err) => { // eslint-disable-line no-unused-vars
					if (err.stack) { console.log(err.stack); return err.stack; }
					console.log(err); return err;
				});
			if (!error.pdf2) { console.log('sent resPdf2');	}
		}

		if (error.pdf || error.pdf2) { return JSON.stringify(error); }
		return false;
	}

	return 'error: no USER_ID';
}

// não funciona na realidade, o facebook não deixa enviar zip, rar, tar etc via broadcast. O que eu faço aqui é transformar o zip em pdf, baixo e transformo em zip de novo já baixado.
async function sendZip(USER_ID, zip) {
	if (USER_ID && USER_ID.toString()) {
		USER_ID = USER_ID.toString();
		const error = {};

		if (zip) {
			error.zip = await client.sendFile(USER_ID, zip.content, { filename: zip.filename.replace('zip', 'pdf') })
				.then((resp) => false).catch((err) => { // eslint-disable-line no-unused-vars
					if (err.stack) { console.log(err.stack); return err.stack; }
					console.log(err); return err;
				});
			if (!error.zip) { console.log('sent zip'); }
		}

		if (error.zip) { return JSON.stringify(error); }
		return false;
	}

	return 'error: no USER_ID';
}


// for admin only
async function sendWarning(csv) {
	const quickReply = {
		quick_replies: [
			{
				content_type: 'text',
				title: 'Voltar',
				payload: 'adminMenu',
			},
		],
	};

	const adminUsers = await chatbotUsers.findAll({ where: { is_admin: true }, raw: true }).then((res) => res).catch((err) => sentryError('Erro em sendWarning.findAll', err));
	for (let i = 0; i < adminUsers.length; i++) {
		const e = adminUsers[i];
		let res = await client.sendFile(e.fb_id, csv.content, { is_reusable: true, filename: csv.filename }).then((resp) => resp).catch((err) => { sentryError('Erro ao sendWarning.text', err); });
		if (res && res.message_id) {
			res = await client.sendText(e.fb_id, missingAnswersWarning.mailText, quickReply).then((resp) => resp).catch((err) => { sentryError('Erro ao sendWarning.text', err); });
		}
	}
}


module.exports = {
	sendCardAluna, sendBroadcastAluna, sendFiles, sendWarning, sendZip,
};
