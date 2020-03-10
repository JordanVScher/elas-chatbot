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
		// try {
		// 	const info = await transporter.sendMail(options);
		// 	console.log(`'${subject}' para ${to}:`, info.messageId);
		// 	return null;
		// } catch (error) {
		// 	console.log('Could not send mail to ', to, 'Error => ', error);
		// 	return error;
		// }
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

async function sendSyncRespostasReport(res) {
	const now = new Date();

	const options = {
		from,
		to: process.env.MAILDEV,
		text: `Em anexo, o relatório gerado pelo sync\n${now}`,
		subject: `Elas - report do syncRespostas - ${now.getDate()}/${now.getMonth()}`,
		attachments: [
			{
				filename: `syncRespostas - ${now}.txt`,
				content: JSON.stringify(res, null, 2),
			},
		],
	};


	try {
		const info = await transporter.sendMail(options);
		console.log(`'${options.subject}' para ${options.to}:`, info.messageId, `with ${options.attachments.length} attachments`);
	} catch (error) {
		console.log(`Could not send '${options.subject}' to `, options.to, 'Error => ', error);
	}
}

module.exports = {
	sendHTMLMail, sendHTMLFile, sendSyncRespostasReport,
};
