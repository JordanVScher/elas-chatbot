const Sentry = require('@sentry/node');
const dialogFlow = require('apiai-promise');
const gsjson = require('google-spreadsheet-to-json');
const accents = require('remove-accents');
const moment = require('moment');
const pdf = require('html-pdf');

moment.locale('pt-BR');
// Sentry - error reporting
Sentry.init({	dsn: process.env.SENTRY_DSN, environment: process.env.ENV, captureUnhandledRejections: false });

async function getJsDateFromExcel(excelDate) {
	if (!Number(excelDate)) {
		throw new Error('wrong input format');
	}

	const secondsInDay = 24 * 60 * 60;
	const missingLeapYearDay = secondsInDay * 1000;
	const delta = excelDate - (25567 + 2);
	const parsed = delta * missingLeapYearDay;
	const date = new Date(parsed);

	if (Object.prototype.toString.call(date) === '[object Date]') {
		if (isNaN(date.getTime())) { // eslint-disable-line
			throw new Error('wrong excel date input');
		} else {
			return date;
		}
	}

	return date;
}

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

// ATIVIDADESCOMPLETAS
const atividadesCompletas = {
	1: 'Atividades 1, 2 e 3', 2: 'Atividades 4, 5 e 6', 3: 'Atividades 7, 8 e 9',
};

function getTimestamp() {
	const date = new Date();
	return moment(date).format('YYYY-MM-DD');
}

function formatDate(date) {
	let day = date.getDate() + 1; // different timezone from spreadsheet
	if (day && day.toString().length === 1) { day = `0${day}`; }
	let month = date.getMonth() + 1;
	if (month && month.toString().length === 1) { month = `0${month}`; }
	return `${day}/${month}`;
}


async function formatModulo1(date) {
	return `dia ${moment(date).utcOffset('+0000').format('DD')} de ${moment(date).utcOffset('+0000').format('MMMM')}`;
}
async function formatModuloHora(date) {
	return `dia ${moment(date).utcOffset('+0000').format('DD')} de ${moment(date).utcOffset('+0000').format('MMMM')} as `
	+ `${moment(date).utcOffset('+0000').format('HH:mm')}`;
}

async function formatFdsMod(date) {
	const primeiraAula = date;
	const segundaAula = moment(primeiraAula, 'DD-MM-YYYY').add(1, 'days');
	const primeiroDia = moment(primeiraAula).utcOffset('+0000').format('DD');
	const segundoDia = moment(segundaAula).utcOffset('+0000').format('DD');
	const primeiroMes = moment(primeiraAula).utcOffset('+0000').format('MMMM');
	const segundoMes = moment(segundaAula).utcOffset('+0000').format('MMMM');
	if (primeiroMes === segundoMes) { // check if month is the same, no need to list two different months
		return `${primeiroDia} e ${segundoDia} de ${primeiroMes}`;
	}

	return `${primeiroDia} de ${primeiroMes} e ${segundoDia} de ${segundoMes}`;
}

async function formatDiasMod(date, days) {
	const newDate = moment(date, 'DD-MM-YYYY').add(days, 'days');
	return `dia ${moment(newDate).utcOffset('+0000').format('DD')} de ${moment(newDate).utcOffset('+0000').format('MMMM')}`;
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


// format excel dates to regular dates
async function getFormatedSpreadsheet() {
	const result = [];
	const spreadsheet = await reloadSpreadSheet(1, 6); // console.log('spreadsheet', spreadsheet); // load spreadsheet

	for (let i = 0; i < spreadsheet.length; i++) {
		const obj = spreadsheet[i];
		const aux = {};
		// eslint-disable-next-line no-loop-func
		await Object.keys(obj).forEach(async (key) => {
			if (key.slice(0, 6) === 'módulo') { // date is 5 digit long, originally its not a string
				aux[key] = await getJsDateFromExcel(obj[key]);
				const whichModule = key.replace('módulo', '');
				let newDatahora = obj[key] + aux[`horárioMódulo${whichModule}`];
				newDatahora = await getJsDateFromExcel(newDatahora);
				if (newDatahora.getMilliseconds() === 999) {
					newDatahora.setMilliseconds(newDatahora.getMilliseconds() + 1);
				}
				aux[`datahora${whichModule}`] = newDatahora;
			} else {
				aux[key] = obj[key];
			}
		});
		result.push(aux);
	}

	return result;
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

async function getCPFValid(cpf) {
	const result = cpf.replace(/[_.,-]/g, '');
	if (!parseInt(cpf, 10)) { return false;	}
	return result;
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

function getPercentageChange(oldNumber, newNumber) {
	const decreaseValue = oldNumber - newNumber;
	const result = ((decreaseValue / oldNumber) * 100) * -1; // invert progression, if the number went up show a positive percentage
	return parseFloat(result.toFixed(2), 10);
}

function buildAlunaMsg(aluna) {
	let result = '';

	if (aluna.id) { result += `ID: ${aluna.id}\n`;	}
	if (aluna.nome_completo) { result += `Nome: ${aluna.nome_completo}\n`;	}
	if (aluna.cpf) { result += `CPF: ${aluna.cpf}\n`;	}
	if (aluna.email) { result += `E-mail: ${aluna.email}\n`;	}
	if (aluna.turma) { result += `Turma: ${aluna.turma}\n`;	}

	return result;
}


function DBError(msg, err) {
	console.log(msg, err); Sentry.captureMessage(msg);
	return false;
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
	getFormatedSpreadsheet,
	formatDate,
	toTitleCase,
	getPercentageChange,
	pdf,
	getJsDateFromExcel,
	formatModulo1,
	formatModuloHora,
	formatFdsMod,
	formatDiasMod,
	atividadesCompletas,
	getTimestamp,
	getCPFValid,
	buildAlunaMsg,
	DBError,
};
