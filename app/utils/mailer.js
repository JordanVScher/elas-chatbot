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

async function sendMailAttach(subject, text, to, filename, content) {
	const options = {
		from: user,
		to,
		subject,
		text,
		attachments: [
			{
				filename,
				content: createReadStream(content),
			},
		],
	};

	try {
		const info = await transporter.sendMail(options);
		console.log(`'${subject}' para ${to}:`, info.messageId);
		setTimeout((filePath) => {
			unlink(filePath, (err) => {
				if (err) console.log(err);
				console.log('File deleted!');
			});
		}, 60000, content);
	} catch (error) {
		console.log('Could not sendMailAttach to ', to);
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

module.exports = {
	sendTestMail, sendMailAttach, sendHTMLMail,
};
