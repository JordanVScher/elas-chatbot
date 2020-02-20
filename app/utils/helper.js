const crypto = require('crypto');
const Sentry = require('@sentry/node');
const gsjson = require('google-spreadsheet-to-json');
const accents = require('remove-accents');
const moment = require('moment');
const pdf = require('html-pdf');
const TinyURL = require('tinyurl');
const { sendHTMLMail } = require('./mailer');

const algorithm = process.env.CRYPTO_ALGORITHM;
const password = process.env.CRYPTO_PASSWORD;

function encrypt(text) {
	const cipher = crypto.createCipher(algorithm, password);
	let crypted = cipher.update(text, 'utf8', 'hex');
	crypted += cipher.final('hex');
	return crypted;
}

function decrypt(text) {
	const decipher = crypto.createDecipher(algorithm, password);
	let dec = decipher.update(text, 'hex', 'utf8');
	dec += decipher.final('utf8');
	return dec;
}

moment.locale('pt-BR');
// Sentry - error reporting
Sentry.init({	dsn: process.env.SENTRY_DSN, environment: process.env.ENV, captureUnhandledRejections: false });

async function getJsDateFromExcel(excelDate) {
	if (!Number(excelDate)) { throw new Error('wrong input format'); }

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

async function sentryError(msg, erro) {
	if (process.env.ENV !== 'local') {
		Sentry.captureMessage(msg);
		await sendHTMLMail(`Erro no bot do ELAS - ${process.env.ENV || ''}`, process.env.MAILDEV, `${msg || ''}\n\n${erro}\n\n${JSON.stringify(erro, null, 2)}`);
		console.log(`Error sent at ${new Date()}!\n `);
	}
	console.log(msg, erro);
	return false;
}

async function capQR(text) {
	let s = text;
	if (s.length > 20) {
		s = `${s.slice(0, 17)}...`;
	}
	return s && s[0].toUpperCase() + s.slice(1);
}

function toTitleCase(str) {
	return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// week day dictionary
const weekDayName = {
	0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 7: 'Domingo',
};

const weekDayNameLong = {
	0: 'Domingo', 1: 'Segunda-Feira', 2: 'Terça-Feira', 3: 'Quarta-Feira', 4: 'Quinta-Feira', 5: 'Sexta-Feira', 6: 'Sábado', 7: 'Domingo',
};

const atividadesCompletas = {
	1: 'ATIVIDADE 1 - RELAÇÃO DE AVALIADORES, ATIVIDADE 2 - SONDAGEM DE FOCO e ATIVIDADE 3 - SEU INVENTÁRIO COMPORTAMENTAL',
	2: 'AVALIAÇÃO MÓDULO 1 e LEITURA PRÉVIA',
	3: 'AVALIAÇÃO MÓDULO 2, SONDAGEM DE FOCO e APRESENTAÇÃO',
};

function getTimestamp() {
	const date = new Date();
	return moment(date).format('YYYY-MM-DD');
}

function formatDate(date) {
	let day = date.getDate();
	if (day && day.toString().length === 1) { day = `0${day}`; }
	let month = date.getMonth() + 1;
	if (month && month.toString().length === 1) { month = `0${month}`; }
	return `${day}/${month}`;
}

async function findModuleToday(turma) {
	let result;
	const today = new Date();
	Object.keys(turma).forEach((element) => {
		// we are looking for the first moduleDate that happens after today
		if (element.slice(0, 6) === 'modulo' && !result) {
			const modDate = turma[element];
			if (today <= modDate) {
				result = element.replace('modulo', '');
			}
		}
	});
	return result;
}

async function formatModulo(date) {
	return `dia ${moment(date).utcOffset('+0000').format('DD')} de ${moment(date).utcOffset('+0000').format('MMMM')}`;
}
async function formatModuloHora(date) {
	return `dia ${moment(date).utcOffset('+0000').format('DD')} de ${moment(date).utcOffset('+0000').format('MMMM')} as `
	+ `${moment(date).utcOffset('+0000').format('HH:mm')}`;
}
async function formatSondagem(date) {
	const d = typeof date === 'string' ? new Date(date) : date;
	return `${moment(d).utcOffset('+0000').format('MMMM').slice(0, 3).toLowerCase()}./${moment(d).utcOffset('+0000').format('DD')}`; // eslint-disable-line
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
const privateKey = require(`../../${process.env.GOOGLE_APPLICATION_CREDENTIALS}`); // eslint-disable-line

async function reloadSpreadSheet(worksheet, headerStart) {
	const results = await gsjson({
		spreadsheetId: process.env.SPREADKEY,
		credentials: privateKey,
		worksheet: worksheet || 0,
		// ignoreRow: [1, 2, 3, 4, 5],
		headerStart: headerStart || '',
		// hash: 'id',
	}).then((result) => result).catch((err) => {
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
	const spreadsheet = await reloadSpreadSheet(0, 6) || []; // console.log('spreadsheet', spreadsheet); // load spreadsheet
	if (!spreadsheet) { sentryError('Couldnt load spreadsheet', spreadsheet); return []; }

	for (let i = 0; i < spreadsheet.length; i++) {
		const obj = spreadsheet[i];
		const aux = {};
		// eslint-disable-next-line no-loop-func
		const lines = Object.keys(obj);

		for (let j = 0; j < lines.length; j++) {
			const key = lines[j];
			if (key.slice(0, 6) === 'módulo') { // date is 5 digit long, originally its not a string
				aux[key] = await getJsDateFromExcel(obj[key]);
				const whichModule = key.replace('módulo', '');
				if (!aux[`horárioMódulo${whichModule}`]) { aux[`horárioMódulo${whichModule}`] = obj[`horárioMódulo${whichModule}`]; } // this has to be set so we force it
				let newDatahora = obj[key] + aux[`horárioMódulo${whichModule}`];
				console.log('newDatahora', newDatahora);
				newDatahora = await getJsDateFromExcel(newDatahora);
				if (newDatahora.getMilliseconds() === 999) {
					newDatahora.setMilliseconds(newDatahora.getMilliseconds() + 1);
				}
				aux[`datahora${whichModule}`] = newDatahora;
			} else {
				aux[key] = obj[key];
			}
		}

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
	const result = cpf.toString().replace(/[_.,-]/g, '');
	if (!result || cpf.length < 11 || !/^\d+$/.test(result)) { return false; }
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
	const difference = newNumber - oldNumber;
	let result = difference / oldNumber;
	result *= 100;
	result = +result.toFixed(0);
	return result.toString();
}

function buildAlunaMsg(aluna) {
	let result = '';

	if (aluna.id) result += `ID: ${aluna.id}\n`;
	if (aluna.nome_completo) result += `Nome: ${aluna.nome_completo}\n`;
	if (aluna.cpf) result += `CPF: ${aluna.cpf}\n`;
	if (aluna.email) result += `E-mail: ${aluna.email}\n`;
	if (aluna.turma) { result += `Turma: ${aluna.turma}\n`;	} else {
		result += 'Turma: Nenhuma Turma\n';
	}

	return result;
}

const indicacaoErro = {
	1: 'Indicado foi cadastrado sem um e-mail',
	2: 'Indicado foi cadastrado com o mesmo e-mail da aluna',
	3: 'Familiar foi cadastrado sem um e-mail',
	4: 'Familiar foi cadastrado com o mesmo e-mail da aluna',
};

async function getIndicacaoErrorText(errors, aluna) {
	let text = `Novos alertas com as indicações da aluna ${aluna.nome}:`;

	errors.forEach((e, i) => {
		text += `\n\nAlerta ${i + 1} - ${indicacaoErro[e.id]}:`;
		if (e.indicado.nome) text += `\nNome: ${e.indicado.nome}`;
		if (e.indicado.relacao) text += `\nRelação: ${e.indicado.relacao}`;
		if (e.indicado.email) text += `\nE-mail: ${e.indicado.email}`;
		if (e.indicado.tele) text += `\nTelefone: ${e.indicado.tele}`;
	});

	text += '\n\nDados da aluna:';
	if (aluna.nome) text += `\nNome: ${aluna.nome}`;
	if (aluna.turma) text += `\nTurma: ${aluna.turma}`;
	if (aluna.cpf) text += `\nCPF: ${aluna.cpf}`;
	if (aluna.email) text += `\nE-mail: ${aluna.email}`;

	return text;
}

async function getSameContatoEmailErrorText(aluna) {
	let text = 'Aluna cadastrou o mesmo e-mail para o contato de emergência:\n';

	if (aluna.nome_completo) text += `\nNome da Aluna: ${aluna.nome_completo}`;
	if (aluna.email) text += `\nE-mail: ${aluna.email}`;
	if (aluna.cpf) text += `\nCPF: ${aluna.cpf}`;
	if (aluna.telefone) text += `\nTelefone: ${aluna.telefone}`;

	text += '\n\nDados do Contato:';
	if (aluna.contato_emergencia_nome) text += `\nNome: ${aluna.contato_emergencia_nome}`;
	if (aluna.contato_emergencia_email) text += `\nE-mail: ${aluna.contato_emergencia_email}`;
	if (aluna.contato_emergencia_fone) text += `\nTelefone: ${aluna.contato_emergencia_fone}`;
	if (aluna.contato_emergencia_relacao) text += `\nRelação com Aluna: ${aluna.contato_emergencia_relacao}`;

	text += '\n\nO e-mail pode ser alterado na opção Inserir Alunas por um administrador da Donna.';

	return text;
}

async function handleErrorApi(options, res, err) {
	let msg = `Endereço: ${options.host}`;
	msg += `\nPath: ${options.path}`;
	msg += `\nQuery: ${JSON.stringify(options.query, null, 2)}`;
	msg += `\nMethod: ${options.method}`;
	msg += `\nMoment: ${new Date()}`;
	if (res) msg += `\nResposta: ${JSON.stringify(res, null, 2)}`;
	if (err) msg += `\nErro: ${err.stack}`;

	// console.log('----------------------------------------------', `\n${msg}`, '\n\n');

	if ((res && (res.error || res.form_error)) || (!res && err)) {
		if (process.env.ENV !== 'local') {
			msg += `\nEnv: ${process.env.ENV}`;
			await Sentry.captureMessage(msg);
		}
	}
}

async function handleRequestAnswer(response) {
	try {
		const res = await response.json();
		await handleErrorApi(response.options, res, false);
		return res;
	} catch (error) {
		await handleErrorApi(response.options, false, error);
		return {};
	}
}

async function buildRecipientObj(context) {
	const state = {
		fb_id: context.session.user.id,
		name: `${context.session.user.first_name} ${context.session.user.last_name}`,
		picture: context.session.user.profile_pic,
		// origin_dialog: 'greetings',
		// session: JSON.stringify(context.state),
	};

	if (context.state.gotAluna && context.state.gotAluna.email) state.email = context.state.alunaMail;
	if (context.state.gotAluna && context.state.gotAluna.cpf) state.cpf = context.state.cpf;

	return state;
}

async function getTinyUrl(originalUrl) {
	const res = await TinyURL.shorten(originalUrl);
	if (res.includes('<') || res === 'Error' || !res) return originalUrl;
	return res;
}

async function cutName(name) {
	let aux = name;
	const array = aux.split(' ');

	while (aux.length > 30) {
		array.pop();
		if (['de', 'e', 'da', 'do', 'des', 'das', 'dos'].includes(array[array.length - 1].toLowerCase())) {
			array.pop();
		}
		aux = array.join(' ');
	}

	return aux;
}

/**
 * Returns an array with arrays of the given size.
 *
 * @param {Array} myArray  Array to split
 * @param {Integer} chunkSize  Size of every group
 */
function chunkArray(myArray, chunkSize) {
	const results = [];
	while (myArray.length) { results.push(myArray.splice(0, chunkSize)); }
	return results;
}

function replaceVarOnCards(cards, toReplace, value) {
	const res = JSON.parse(JSON.stringify(cards));
	res.forEach((obj) => {
		Object.keys(obj).forEach((key) => {
			if (obj[key].includes(toReplace)) {
				obj[key] = obj[key].replace(toReplace, value);
			}
		});
	});

	return res;
}

function buildModDateChange(date) {
	const dateRegex = /MOD[123]_(PRE|POS)_\d+/;
	if (!date || typeof date !== 'string' || dateRegex.test(date) === false) return false;
	let text = date;
	text = text.replace('MOD', '');
	const module = text.charAt(0);
	if (!['1', '2', '3'].includes(module)) { return false; }
	text = text.replace(module, '');
	let negative = null;
	if (date.includes('PRE')) { negative = true; text = text.replace('_PRE_', ''); }
	if (date.includes('POS')) { negative = false; text = text.replace('_POS_', ''); }
	if (negative === null) { return false; }
	const days = negative ? text * -1 : parseInt(text, 10);

	return { module, days };
}

module.exports = {
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
	formatModulo,
	formatModuloHora,
	formatFdsMod,
	formatDiasMod,
	formatSondagem,
	atividadesCompletas,
	getTimestamp,
	getCPFValid,
	buildAlunaMsg,
	sentryError,
	findModuleToday,
	getIndicacaoErrorText,
	getSameContatoEmailErrorText,
	getTinyUrl,
	handleRequestAnswer,
	buildRecipientObj,
	cutName,
	encrypt,
	decrypt,
	chunkArray,
	replaceVarOnCards,
	buildModDateChange,
};
