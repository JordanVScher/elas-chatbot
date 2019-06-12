const Sentry = require('@sentry/node');
const dialogFlow = require('apiai-promise');
const gsjson = require('google-spreadsheet-to-json');
const accents = require('remove-accents');
const moment = require('moment');

// Sentry - error reporting
Sentry.init({	dsn: process.env.SENTRY_DSN, environment: process.env.ENV, captureUnhandledRejections: false });


moment.locale('pt-BR');

async function capQR(text) {
	let s = text;
	if (s.length > 20) {
		s = `${s.slice(0, 17)}...`;
	}
	return s && s[0].toUpperCase() + s.slice(1);
}

function toTitleCase(str) {
	return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// week day dictionary
const weekDayName = {
	0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 7: 'Domingo',
};

const weekDayNameLong = {
	0: 'Domingo', 1: 'Segunda-Feira', 2: 'Terça-Feira', 3: 'Quarta-Feira', 4: 'Quinta-Feira', 5: 'Sexta-Feira', 6: 'Sábado', 7: 'Domingo',
};


function formatDate(date) {
	let day = date.getDate() + 1; // different timezone from spreadsheet
	if (day && day.toString().length === 1) { day = `0${day}`; }
	let month = date.getMonth() + 1;
	if (month && month.toString().length === 1) { month = `0${month}`; }
	return `${day}/${month}`;
}


// # Google Spreadsheet
const privateKey = require('../../private_key.json');

async function reloadSpreadSheet(worksheet, headerStart) {
	const results = await gsjson({
		spreadsheetId: process.env.SPREADKEY,
		credentials: privateKey,
		worksheet: worksheet || 0,
		// ignoreRow: [1, 2, 3, 4, 5],
		headerStart: headerStart || '',
		// hash: 'id',
	}).then(result => result).catch((err) => {
		console.log(err.message);
		console.log(err.stack);
		Sentry.captureMessage('Erro no carregamento do spreadsheet');
		return undefined;
	});

	// console.log('reloadSpreadSheet', results);

	return results;
}

// separates string in the first dot on the second half of the string
async function separateString(someString) {
	if (someString.trim()[someString.length - 1] !== '.') { // trying to guarantee the last char is a dot so we never use halfLength alone as the divisor
		someString += '.'; // eslint-disable-line no-param-reassign
	}
	const halfLength = Math.ceil(someString.length / 2.5); // getting more than half the length (the bigger the denominator the shorter the firstString tends to be)
	const newString = someString.substring(halfLength); // get the second half of the original string
	const sentenceDot = new RegExp('(?<!www)\\.(?!com|br|rj|sp|mg|bh|ba|sa|bra|gov|org)', 'i');// Regex -> Don't consider dots present in e-mails and urls
	// getting the index (in relation to the original string -> halfLength) of the first dot on the second half of the string. +1 to get the actual dot.
	const dotIndex = halfLength + newString.search(sentenceDot) + 1;

	const firstString = someString.substring(0, dotIndex);
	const secondString = someString.substring(dotIndex);

	return { firstString, secondString };
}

async function formatDialogFlow(text) {
	let result = text.toLowerCase();
	result = await result.replace(/([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF])/g, '');
	result = await accents.remove(result);
	if (result.length >= 250) {
		result = result.slice(0, 250);
	}
	return result.trim();
}

module.exports = {
	apiai: dialogFlow(process.env.DIALOGFLOW_TOKEN),
	Sentry,
	separateString,
	moment,
	capQR,
	formatDialogFlow,
	weekDayName,
	weekDayNameLong,
	reloadSpreadSheet,
	formatDate,
	toTitleCase,
};
