
require('dotenv').config();

const PagSeguro = require('pagseguro-nodejs');
const { promisify } = require('util');
const { parseString } = require('xml2js');
const smHelp = require('./utils/sm_help');
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

async function createVenda(itemId = 1) { // for testing only, creates a link to a fake pagseguro purchase
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

// what to do after someone buys one of the products
async function handlePagamento(notification) {
	await pagseguro.notification(notification.notificationCode, async (success, response) => { // get transaction details based on notificationCode
		if (success && !response.error) {
			try {
				const answer = await xmlParse(response); console.log('answer', JSON.stringify(answer, null, 2)); // parse xml to json
				const productID = answer.transaction.items[0].item[0].id[0]; console.log('productID', productID); // productID
				await db.upsertPagamento(answer.transaction.sender[0].documents[0].document[0].type[0], answer.transaction.sender[0].documents[0].document[0].value[0],
					answer.transaction.sender[0].email[0], productID, answer.transaction.code[0]); // saves pagamento
				await smHelp.sendMatricula(productID, process.env.ENV === 'local' ? 'jordanvscher@hotmail.com' : answer.transaction.sender[0].email[0]); // send email
				// await smHelp.sendMatricula(productID, 'jordan@appcivico.com'); // send email
			} catch (error) {
				Sentry.captureMessage('Erro em handleNotification');
			}
		} else {
			Sentry.captureMessage('Erro em pagseguro.notification');
		}
	});
}

// const mock = {
// 	notificationCode: '718264-C46A096A0932-0DD41B8F8995-FDA5A0',
// 	notificationType: 'transaction',
// };

// handlePagamento(mock);

module.exports = {
	createVenda, handlePagamento,
};
