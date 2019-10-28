const req = require('requisition');
const { handleRequestAnswer } = require('./helper');
const { sentryError } = require('./helper');

async function createNewLabel(labelName, pageToken) {
	return handleRequestAnswer(await req.post('https://graph.facebook.com/v4.0/me/custom_labels').query({ name: labelName, access_token: pageToken }));
}

async function linkUserToLabel(PSID, labelID, pageToken) {
	return handleRequestAnswer(await req.post(`https://graph.facebook.com/v4.0/${labelID}/label`).query({ user: PSID, access_token: pageToken }));
}

async function removeUserFromLabel(PSID, labelID, pageToken) {
	return handleRequestAnswer(await req.delete(`https://graph.facebook.com/v4.0/${labelID}/label`).query({ user: PSID, access_token: pageToken }));
}

async function getUserLabels(PSID, pageToken) {
	return handleRequestAnswer(await req.get(`https://graph.facebook.com/v4.0/${PSID}/custom_labels`).query({ access_token: pageToken, fields: 'name' }));
}

async function getLabelDetails(labelID, pageToken) {
	return handleRequestAnswer(await req.get(`https://graph.facebook.com/v4.0/${labelID}`).query({ access_token: pageToken, fields: 'name' }));
}

async function listAllLabels(pageToken) {
	return handleRequestAnswer(await req.get('https://graph.facebook.com/v4.0/me/custom_labels').query({ access_token: pageToken, fields: 'name' }));
}

async function deleteLabel(labelID, pageToken) {
	return handleRequestAnswer(await req.delete(`https://graph.facebook.com/v4.0/${labelID}`).query({ access_token: pageToken }));
}

// checks if user is on the label using the id
// return label details if user is on the label
async function checkUserOnLabel(PSID, labelID, pageToken) {
	try {
		const userLabels = await getUserLabels(PSID, pageToken);
		const theOneLabel = await userLabels.data.find(x => x.id === `${labelID}`); // find the one label with the same ID

		if (theOneLabel) { return theOneLabel; }
		return false;
	} catch (error) {
		return sentryError('Erro em checkUserOnLabel', error);
	}
}

// checks if user is on the label using the label name
// return label details if user is on the label
async function checkUserOnLabelName(PSID, labelName, pageToken) {
	try {
		const userLabels = await getUserLabels(PSID, pageToken);
		const theOneLabel = await userLabels.data.find(x => x.name === `${labelName}`); // find the one label with the same name

		if (theOneLabel) { return theOneLabel; }
		return false;
	} catch (error) {
		return sentryError('Erro em checkUserOnLabel', error);
	}
}

// get the id of the label using the name, returns only the label id
// created: create a new label if the one we want doesnt exist, turn off by passing false
async function getLabelID(labelName, pageToken, create = true) {
	try {
		const labelList = await listAllLabels(pageToken);
		const theOneLabel = await labelList.data.find(x => x.name === `${labelName}`);
		if (theOneLabel && theOneLabel.id) { return theOneLabel.id; }
		if (create) {
			const newLabel = await createNewLabel(labelName, pageToken);
			if (newLabel) { return newLabel.id;	}
		}
		return undefined;
	} catch (error) {
		return sentryError('Erro em getLabelID', error);
	}
}

// link user to a label by passing its name
// created: create a new label if the one we want doesnt exist, turn off by passing false
async function linkUserToLabelByName(PSID, labelName, pageToken, create = true) {
	const labelID = await getLabelID(labelName, pageToken, create);

	if (labelID) { return linkUserToLabel(PSID, labelID, pageToken); }
	return false;
}


module.exports = {
	createNewLabel,
	linkUserToLabel,
	removeUserFromLabel,
	getUserLabels,
	getLabelDetails,
	listAllLabels,
	deleteLabel,
	checkUserOnLabel,
	checkUserOnLabelName,
	getLabelID,
	linkUserToLabelByName,
};
