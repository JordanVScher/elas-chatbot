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
		let quickReply = [];
		if (buttons && buttons.length > 0) {
			quickReply = { quick_replies: buttons };
		}


		const response = await client.sendText(USER_ID, textMsg, quickReply).then(resp => true).catch((error) => { // eslint-disable-line no-unused-vars
			console.log(error.stack); // error stack trace
			// console.log(error); // formatted error message
			// console.log(error.config); // axios request config
			// console.log(error.request); // HTTP request
			// console.log(error.response); // HTTP response
			return false;
		});


		if (response) { console.log(`Broadcast sent to ${USER_ID}`);	}
		return response;
	}

	return false;
}

async function sendCardAluna(USER_ID, cards, cpf) {
	if (USER_ID) {
		const elements = [];
		cards.forEach(async (element) => {
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

		const response = await client.sendAttachment(USER_ID, {
			type: 'template',
			payload: {
				template_type: 'generic',
				elements,
			},
		}).then(resp => true).catch((error) => { // eslint-disable-line no-unused-vars
			console.log(error.stack); // error stack trace
			return false;
		});

		if (response) { console.log(`Broadcast sent to ${USER_ID}`); }
		return response;
	}

	return false;
}

async function sendFiles(USER_ID, pdf, png) {
	if (USER_ID) {
		if (pdf) {
			const resPdf = await client.sendFile(USER_ID, createReadStream(pdf.content), { filename: pdf.filename })
				.then(resp => true).catch((error) => { // eslint-disable-line no-unused-vars
					console.log(error.stack); // error stack trace
					return false;
				});
			console.log('resPdf', resPdf);
		}
		if (png) {
			const resPng = await client.sendFile(USER_ID, png.content, { filename: png.filename })
				.then(resp => true).catch((error) => { // eslint-disable-line no-unused-vars
					console.log(error.stack); // error stack trace
					return false;
				});
			console.log('resPng', resPng);
		}
	}
}


module.exports = {
	sendCardAluna, sendBroadcastAluna, sendFiles,
};
