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

async function sendTestMail(subject, text, to) {
	const options = {
		from, to, subject, text,
	};

	try {
		const info = await transporter.sendMail(options);
		console.log(`'${subject}' para ${to}:`, info.messageId);
	} catch (error) {
		console.log('Could not send mail to ', to);
		console.log('Error => ', error);
	}
}

async function sendHTMLMail(subject, to, html, anexo) {
	const options = {
		from, to, subject: subject ? subject.toUpperCase() : '<Programa Elas>', html, attachments: anexo,
	};


	try {
		const info = await transporter.sendMail(options);
		console.log(`'${subject}' para ${to}:`, info.messageId);
		return false;
	} catch (error) {
		console.log('Could not send mail to ', to, 'Error => ', error);
		return error;
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

module.exports = {
	sendTestMail, sendHTMLMail, sendHTMLFile,
};
