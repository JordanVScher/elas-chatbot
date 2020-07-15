require('dotenv').config();

const { createReadStream } = require('fs');
const nodemailer = require('nodemailer');
// const { Sentry } = require('./helper');

const user = process.env.MAIL_USER;
const pass = process.env.MAIL_PASS;
const host = process.env.MAIL_HOST;
const port = process.env.MAIL_PORT;
const service = process.env.MAIL_SERVICE;
const from = process.env.MAIL_FROM;

const transporter = nodemailer.createTransport({
	service,
	host,
	port,
	auth: {
		user,
		pass,
		secure: true, // use SSL
	},
	tls: { rejectUnauthorized: false },
	debug: true,
});

async function sendHTMLMail(subject, to, html, anexo, text = '') {
	const options = {
		from, to, subject: subject || '<Programa Elas>', html, attachments: anexo, text,
	};

	if (process.env.ENV === 'prod_final') {
		try {
			const info = await transporter.sendMail(options);
			console.log(`'${subject}' para ${to}:`, info.messageId);
			return null;
		} catch (error) {
			console.log('Could not send mail to ', to, 'Error => ', error);
			return error;
		}
	} else {
		console.log(`\nDeveriamos enviar '${subject}' para ${to} as ${new Date()}\n`);
		return null;
	}
}
async function sendHTMLFile(subject, to, html, pdf, png) {
	const options = {
		from, to, subject, html, attachments: [],
	};

	if (pdf && pdf.filename && pdf.content) {
		options.attachments.push({
			filename: pdf.filename,
			content: createReadStream(pdf.content),
			contentType: 'application/pdf',
		});
	}

	if (png && png.filename && png.content) {
		options.attachments.push({
			filename: png.filename,
			content: png.content,
			contentType: 'image/png',
		});
	}

	try {
		const info = await transporter.sendMail(options);
		console.log(`'${subject}' para ${to}:`, info.messageId, `with ${options.attachments.length} attachments`);
	} catch (error) {
		console.log('Could not send mail to ', to, 'Error => ', error);
	}
}

async function sendReport(res, text, subject, filename) {
	const now = new Date();

	const options = {
		from,
		to: process.env.MAILDEV,
		text: `${text}\n${now}`,
		subject: `${subject} - ${now.getDate()}/${now.getMonth()}`,
		attachments: [
			{
				filename: `${filename} - ${now}.txt`,
				content: JSON.stringify(res, null, 2),
			},
		],
	};

	if (process.env.ENV === 'prod_final') {
		try {
			const info = await transporter.sendMail(options);
			console.log(`'${options.subject}' para ${options.to}:`, info.messageId, `with ${options.attachments.length} attachments`);
		} catch (error) {
			console.log(`Could not send '${options.subject}' to `, options.to, 'Error => ', error);
		}
	}
}

module.exports = {
	sendHTMLMail, sendHTMLFile, sendReport,
};


----------------------------------------------
id                 | 6259
notification_type  | 1
aluno_id           | 16
indicado_id        |
sent_at            | 2020-07-15 17:01:54.779+00
error              | {"chatbot":{"sent":false,"msg":"Aluna não está vinculada no chatbot","moment":"2020-07-15T17:01:54.786Z"}}
created_at         | 2020-07-10 14:22:28.588+00
updated_at         | 2020-07-15 17:01:54.786+00
check_answered     |
turma_id           | 22
sent_at_chatbot    |
additional_details |
-[ RECORD 2 ]------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
id                 | 6237
notification_type  | 1
aluno_id           | 215
indicado_id        |
sent_at            | 2020-07-15 17:01:54.04+00
error              |
created_at         | 2020-07-10 13:25:22.235+00
updated_at         | 2020-07-15 17:01:54.269+00
check_answered     |
turma_id           | 22
sent_at_chatbot    | 2020-07-15 17:01:54.268+00
additional_details |
-[ RECORD 3 ]------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
id                 | 8601
notification_type  | 1
aluno_id           | 20
indicado_id        |
sent_at            | 2020-07-15 17:01:55.161+00
error              | {"chatbot":{"sent":false,"error":"Error: Messenger API - 10 OAuthException (#10) This message is sent outside of allowed window. Learn more about the new policy here: https://developers.facebook.com/docs/messenger-platform/policy-overview\n    at handleError (/src/node_modules/messaging-api-messenger/lib/MessengerClient.js:91:11)\n    at processTicksAndRejections (internal/process/task_queues.js:86:5)","moment":"2020-07-15T17:01:55.260Z"}}
created_at         | 2020-07-15 16:58:33.716+00
updated_at         | 2020-07-15 17:01:55.26+00
check_answered     |
turma_id           | 22
sent_at_chatbot    |
additional_details |
