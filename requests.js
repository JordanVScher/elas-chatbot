require('dotenv').config();

const testFolder = './.sessions/';
const fs = require('fs');
const { linkUserToLabelByName } = require('./app/utils/labels');
const { changeAdminStatus } = require('./app/utils/DB_helper');

async function getFBIDJson() { // eslint-disable-line
	const result = {};

	await fs.readdirSync(testFolder).forEach(async (file) => {
		const obj = JSON.parse(await fs.readFileSync(testFolder + file, 'utf8'));
		result[obj.user.name] = obj.user.id;
	});

	return result;
}

async function getNameFBID(req, res) {
	const body = JSON.parse(req.body || '{}');
	if (!body || !body.security_token) {
		res.status(400); res.send('Param security_token is required!');
	} else {
		const securityToken = body.security_token;
		if (securityToken !== process.env.SECURITY_TOKEN_MA) {
			res.status(401); res.send('Unauthorized!');
		} else {
			const result = await getFBIDJson();
			if (result) {
				res.status(200); res.send(result);
			} else {
				res.status(500); res.send('Failure');
			}
		}
	}
}

async function addLabel(req, res) {
	if (!req.body || !req.body.user_id || !req.body.label_name || !req.body.security_token || !req.body.fb_access_token) {
		res.status(400); res.send('Params user_id, label_name, security_token and fb_access_token are required!');
	} else {
		const userID = req.body.user_id;
		const labelName = req.body.label_name;
		const securityToken = req.body.security_token;
		const pageToken = req.body.fb_access_token;
		if (securityToken !== process.env.SECURITY_TOKEN_MA) {
			res.status(401); res.send('Unauthorized!');
		} else {
			const response = {};
			response.facebook_label = await linkUserToLabelByName(userID, labelName, pageToken, true);
			if (labelName === 'admin') {
				response.database_label = await changeAdminStatus(userID, true);
			}

			res.status(200); res.send(response);
		}
	}
}


module.exports = {
	getNameFBID, addLabel,
};
