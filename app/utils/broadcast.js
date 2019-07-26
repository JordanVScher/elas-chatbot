require('dotenv').config();

const { MessengerClient } = require('messaging-api-messenger');
const { createReadStream } = require('fs');

const config = require('../bottender.config').messenger;

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

async function sendBroadcastAluna(USER_ID, textMsg, buttons) {
	if (USER_ID) {
		const newButtons = JSON.parse(buttons);
		let quickReply = [];
		if (newButtons && newButtons.length > 0) { quickReply = { quick_replies: newButtons }; }

		const error = await client.sendText(USER_ID, textMsg, quickReply).then(resp => false).catch((err) => { // eslint-disable-line no-unused-vars
			if (err.stack) { console.log(err.stack); return err.stack; }
			console.log(err); return err;
		});

		if (!error) { console.log(`Broadcast sent to ${USER_ID}`);	}
		return error;
	}

	return 'error: no USER_ID';
}

async function sendCardAluna(USER_ID, cards, cpf) {
	if (USER_ID) {
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
		}).then(resp => false).catch((err) => { // eslint-disable-line no-unused-vars
			if (err.stack) { console.log(err.stack); return err.stack; }
			console.log(err); return err;
		});

		if (!error) { console.log(`Card Broadcast sent to ${USER_ID}`); }
		return error;
	}

	return 'error: no USER_ID';
}

async function sendFiles(USER_ID, pdf, png) {
	if (USER_ID) {
		const error = {};
		if (pdf) {
			error.pdf = await client.sendFile(USER_ID, createReadStream(pdf.content), { filename: pdf.filename })
				.then(resp => false).catch((err) => { // eslint-disable-line no-unused-vars
					if (err.stack) { console.log(err.stack); return err.stack; }
					console.log(err); return err;
				});
			if (!error.pdf) { console.log('sent resPdf');	}
		}
		if (png) {
			error.png = await client.sendFile(USER_ID, png.content, { filename: png.filename })
				.then(resp => false).catch((err) => { // eslint-disable-line no-unused-vars
					if (err.stack) { console.log(err.stack); return err.stack; }
					console.log(err); return err;
				});
			if (!error.png) { console.log('sent resPng'); }
		}

		if (error.pdf || error.png) { return JSON.stringify(error); }
		return false;
	}

	return 'error: no USER_ID';
}


module.exports = {
	sendCardAluna, sendBroadcastAluna, sendFiles,
};
