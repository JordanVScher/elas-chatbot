require('dotenv').config();

const testFolder = './.sessions/';
const fs = require('fs');
const { linkUserToLabelByName } = require('./app/utils/labels');
const { changeAdminStatus } = require('./app/utils/DB_helper');
const { addNewNotificationAlunas } = require('./app/utils/notificationAddQueue');
const { sendNotificationFromQueue } = require('./app/utils/notificationSendQueue');
const { seeDataQueue } = require('./app/utils/notificationAddQueue');
const { addMissingNotificationOnQueue } = require('./app/utils/notificationAddQueue');
const { addMissingAlunoNotification } = require('./app/utils/notificationAddQueue');
const { sendDonnaMail } = require('./app/utils/sm_help');
const { saveAnswer } = require('./app/utils/surveys/questionario_save');

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

async function addMissingNotification(req, res) {
	const { body } = req;
	if (!body || !body.security_token) {
		res.status(400); res.send('Param security_token is required!');
	} else {
		const securityToken = body.security_token;
		if (securityToken !== process.env.SECURITY_TOKEN_MA) {
			res.status(401); res.send('Unauthorized!');
		} else if (!body.notification_type || !body.turma_id) {
			res.status(401); res.send('Missing aluno_id or turma_id!');
		} else {
			addMissingAlunoNotification(body.turma_id, body.notification_type);
			res.status(200); res.send('Processando');
		}
	}
}

async function addNewQueue(req, res) {
	const { body } = req;
	if (!body || !body.security_token) {
		res.status(400); res.send('Param security_token is required!');
	} else {
		const securityToken = body.security_token;
		if (securityToken !== process.env.SECURITY_TOKEN_MA) {
			res.status(401); res.send('Unauthorized!');
		} else if (!body.aluno_id || !body.turma_id) {
			res.status(401); res.send('Missing aluno_id or turma_id!');
		} else {
			addNewNotificationAlunas(body.aluno_id, body.turma_id);
			res.status(200); res.send('Processando');
		}
	}
}

async function sendNotificationQueue(req, res) {
	const { body } = req;
	if (!body || !body.security_token) {
		res.status(400); res.send('Param security_token is required!');
	} else {
		const securityToken = body.security_token;
		if (securityToken !== process.env.SECURITY_TOKEN_MA) {
			res.status(401); res.send('Unauthorized!');
		} else {
			sendNotificationFromQueue(body.aluno_id, body.notification_type);
			res.status(200); res.send('Processando');
		}
	}
}

async function dataQueue(req, res) {
	const { body } = req;
	if (!body || !body.security_token) {
		res.status(400); res.send('Param security_token is required!');
	} else {
		const securityToken = body.security_token;
		if (securityToken !== process.env.SECURITY_TOKEN_MA) {
			res.status(401); res.send('Unauthorized!');
		} else if (!body.turma_id) {
			res.status(401); res.send('body.turma_id missing!');
		} else {
			const result = await seeDataQueue(body.turma_id);
			res.status(200); res.send(result);
		}
	}
}

async function seeQueue(req, res) {
	const { body } = req;
	if (!body || !body.security_token) {
		res.status(400); res.send('Param security_token is required!');
	} else {
		const securityToken = body.security_token;
		if (securityToken !== process.env.SECURITY_TOKEN_MA) {
			res.status(401); res.send('Unauthorized!');
		} else if (!body.turma_id) {
			res.status(401); res.send('body.turma_id missing!');
		} else {
			const result = await addMissingNotificationOnQueue(body.turma_id);
			res.status(200); res.send(result);
		}
	}
}

async function donnaMail(req, res) {
	const { body } = req;
	if (!body || !body.security_token) {
		res.status(400); res.send('Param security_token is required!');
	} else {
		const securityToken = body.security_token;
		if (securityToken !== process.env.SECURITY_TOKEN_MA) {
			res.status(401); res.send('Unauthorized!');
		} else if (!body.nome || !body.email) {
			res.status(401); res.send('body.nome or body.email missing');
		} else {
			const result = await sendDonnaMail(body.nome, body.email);
			res.status(200); res.send(result);
		}
	}
}
async function saveNewAnswer(req, res) {
	const { body } = req;
	if (!body || !body.security_token) {
		res.status(400); res.send('Param security_token is required!');
	} else {
		const securityToken = body.security_token;
		if (securityToken !== process.env.SECURITY_TOKEN_MA) {
			res.status(401); res.send('Unauthorized!');
		} else if (!body.questionarioID || !body.answerID || (!body.alunoID && !body.indicadoID)) {
			res.status(401); res.send('questionarioID or answerIDor or alunoID or indicadoID missing');
		} else {
			const result = await saveAnswer(body.questionarioID, body.answerID, body.alunoID, body.indicadoID);
			res.status(200); res.send(result);
		}
	}
}


module.exports = {
	getNameFBID, addLabel, addMissingNotification, sendNotificationQueue, dataQueue, seeQueue, addNewQueue, donnaMail, saveNewAnswer,
};
