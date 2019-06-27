require('dotenv').config();

const { unlink } = require('fs');
const { createReadStream } = require('fs');
const nodemailer = require('nodemailer');
// const { Sentry } = require('./helper');

const user = process.env.SENDER_EMAIL;
const pass = process.env.SENDER_PASSWORD;
// const sendTo = process.env.EMAIL_TO_RECEIVE;
const service = process.env.SERVICE;


const transporter = nodemailer.createTransport({
	service,
	// host: process.env.SMTP_SERVER,
	// port: process.env.SMTP_PORT,
	auth: {
		user,
		pass,
	},
	tls: { rejectUnauthorized: false },
	debug: true,
});

async function sendTestMail(subject, text, to) {
	const options = {
		from: user,
		to,
		subject,
		text,
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
		from: user,
		to,
		subject,
		html,
	};

	if (anexo) {
		options.attachments = [
			{
				filename: `${anexo}.pdf`,
				content: createReadStream(`${process.cwd()}/${anexo}.pdf`),
				contentType: 'application/pdf',
			},
		];
	}

	try {
		const info = await transporter.sendMail(options);
		console.log(`'${subject}' para ${to}:`, info.messageId);
	} catch (error) {
		console.log('Could not send mail to ', to);
		console.log('Error => ', error);
	}
}
async function sendHTMLFile(subject, to, html, pdf, png) {
	const options = {
		from: user,
		to,
		subject,
		html,
		attachments: [],
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
		console.log('Could not send mail to ', to);
		console.log('Error => ', error);
	}
}

module.exports = {
	sendTestMail, sendHTMLMail, sendHTMLFile,
};
