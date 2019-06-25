require('dotenv').config();

const { MessengerClient } = require('messaging-api-messenger');

const config = require('../bottender.config').messenger;

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

async function sendBroadcastAluna(USER_ID, textMsg) {
	const response = await client.sendText(USER_ID, textMsg).then(resp => true).catch((error) => { // eslint-disable-line no-unused-vars
		console.log(error.stack); // error stack trace
		// console.log(error); // formatted error message
		// console.log(error.config); // axios request config
		// console.log(error.request); // HTTP request
		// console.log(error.response); // HTTP response
		return false;
	});

	return response;
}


module.exports = {
	sendBroadcastAluna,
};
