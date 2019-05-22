
require('dotenv').config();

const PagSeguro = require('pagseguro-nodejs');
const { promisify } = require('util');
const { parseString } = require('xml2js');
// const { reloadSpreadSheet } = require('./utils/helper');
const { Sentry } = require('./utils/helper');
const db = require('./utils/DB_helper');

const pagseguro = new PagSeguro({
	email: process.env.PAG_SEGURO_EMAIL,
	token: process.env.PAG_SEGURO_TOKEN,
	mode: PagSeguro.MODE_SANDBOX,
	// debug: true,
});

const xmlParse = promisify(parseString);
pagseguro.transactionPromise = promisify(pagseguro.transaction);
pagseguro.notificationPromise = promisify(pagseguro.notification);

async function createVenda(itemId = 1) {
	pagseguro.currency('BRL');
	// pagseguro.reference('foo_id');
	// pagseguro.redirect('https://123.ngrok.io/pagamento/bar');
	pagseguro.notify('https://e49f5eb4.ngrok.io/pagamento');

	pagseguro.addItem({
		id: itemId,
		description: 'Item Foobar',
		amount: '100.00',
		quantity: '10',
	});

	pagseguro.sender({
		name: 'Sr. Foo bar',
		email: process.env.PAG_SEGURO_BUYER,
		phone: {
			areaCode: '51',
			number: '12345678',
		},
	});

	pagseguro.shipping({
		type: 1,
		name: 'Sr. Foo bar',
		email: process.env.PAG_SEGURO_BUYER,
		address: {
			street: 'Av. Foo bar',
			number: '10',
			city: 'Foo bar',
			state: 'SP',
			country: 'BRA',
		},
	});

	pagseguro.checkout(async (success, response) => {
		if (success) {
			console.log(response);
			const answer = await xmlParse(response);
			console.log(answer);
			console.log(`https://sandbox.pagseguro.uol.com.br/v2/checkout/payment.html?code=${answer.checkout.code}`);
		} else {
			console.error(response);
		}
	});
}

async function handleNotification(notification) {
	await pagseguro.notification(notification.request.parameters.notificationCode, async (success, response) => { // get transaction details based on notificationCode
		if (success && !response.error) {
			try {
				const answer = await xmlParse(response); console.log('answer', JSON.stringify(answer, null, 2)); // parse xml to json
				const productID = answer.transaction.items[0].item[0].id[0]; console.log('productID', productID); // productID
				// const spreadsheet = await reloadSpreadSheet(); console.log('spreadsheet', spreadsheet); // load spreadsheet
				// const column = await spreadsheet.find(x => x.pagseguroId.toString() === productID); console.log(column); // get same product id (we want to know the "turma")
				await db.upsertPagamento(answer.transaction.sender[0].documents[0].document[0].type[0], answer.transaction.sender[0].documents[0].document[0].value[0],
					answer.transaction.sender[0].email[0], productID, answer.transaction.code[0]);
			} catch (error) {
				Sentry.captureMessage('Erro em handleNotification');
			}
		} else {
			Sentry.captureMessage('Erro em pagseguro.notification');
		}
	});
}


const mock = {
	request: {
		url: 'https://127.0.0.1:4100/pagamento',
		parameters: {
			notificationType: 'transaction',
			notificationCode: '7C0D87D57B8C7B8C7665549CDF97996CE6DE',
		},
		headers: {},
		method: 'POST',
	},
	response: {
		headers: {},
		body: '',
		'status-code': '403',
	},
	created: '2019-05-22T15:10:17.831-0300',
};


module.exports = {
	createVenda, handleNotification,
};
