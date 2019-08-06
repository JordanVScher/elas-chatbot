require('dotenv').config();

const { MessengerClient } = require('messaging-api-messenger');
const config = require('../bottender.config').messenger;
const flow = require('./flow');

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

async function createGetStarted() { // eslint-disable-line no-unused-vars
	console.log(await client.setGetStarted('greetings'));
	console.log(await client.setGreeting([{
		locale: 'default',
		text: flow.getStarted,
	}]));
}

async function createPersistentMenu() { // eslint-disable-line no-unused-vars
	console.log(await client.setPersistentMenu([
		{
			locale: 'default',
			call_to_actions: [
				{
					type: 'postback',
					title: 'Ir para o início',
					payload: 'greetings',
				},
				// 	type: 'web_url',
				// 	title: 'Example site',
				// 	url: 'http://www.google.com/',
				// },
				{
					type: 'nested',
					title: 'Notificações 🔔',
					call_to_actions: [
						{
							type: 'postback',
							title: 'Ligar Notificações 👌',
							payload: 'notificationOn',
						},
						{
							type: 'postback',
							title: 'Parar Notificações 🛑',
							payload: 'notificationOff',
						},
					],
				},
			],
		},
	]));
}

async function buildMenu() { // eslint-disable-line
	createGetStarted();
	createPersistentMenu();
}

async function checkUserOnLabel(UserID, labelID) { // checks if user is on the label
	const userLabels = await client.getAssociatedLabels(UserID);
	const theOneLabel = await userLabels.data.find(x => x.id === `${labelID}`); // find the one label with the same ID

	if (theOneLabel) { // if we found the label on the user
		return true;
	}
	return false;
}

async function getLabelID(labelName) {
	const labelList = await client.getLabelList();

	const theOneLabel = await labelList.data.find(x => x.name === `${labelName}`);
	if (theOneLabel && theOneLabel.id) { // check if label exists
		return theOneLabel.id;
	}
	const newLabel = await client.createLabel(labelName);
	if (newLabel) {
		return newLabel.id;
	}
	return undefined;
}

// Associates user to a label. Pass in the custom label id and the user psid
// associatesLabelToUser('123123', process.env.LABEL_ADMIN);
async function associatesLabelToUser(userID, labelID) { // eslint-disable-line no-unused-vars
	if (await checkUserOnLabel(userID, labelID) === true) {
		return true;
	}

	// const userLabels = await client.getAssociatedLabels(userID);
	// if (userLabels.data.length >= 20) { // actual facebook limit is 25 (by limit i mean before pagination starts to act up)
	// 	userLabels.data.forEach(async (element) => {
	// 		if (element.id !== process.env.LABEL_ADMIN) { // remove every tag except for admin
	// 			client.dissociateLabel(userID, element.id);
	// 		}
	// 	});
	// }

	return client.associateLabel(userID, labelID);
}


module.exports = {
	checkUserOnLabel, associatesLabelToUser, getLabelID,
};
