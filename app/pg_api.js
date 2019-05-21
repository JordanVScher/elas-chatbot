
require('dotenv').config();

const PagSeguro = require('pagseguro-nodejs');
const { promisify } = require('util');
const { parseString } = require('xml2js');

const xmlParse = promisify(parseString);

const pagseguro = new PagSeguro({
	email: process.env.PAG_SEGURO_EMAIL,
	token: process.env.PAG_SEGURO_TOKEN,
	mode: PagSeguro.MODE_SANDBOX,
	// debug: true,
});

pagseguro.currency('BRL');
// pagseguro.reference('foo_id');
// pagseguro.redirect('https://123.ngrok.io/pagamento/bar');
// pagseguro.notify('https://123.ngrok.io/pagamento');

pagseguro.addItem({
	id: '1',
	description: 'Item Foobar',
	amount: '100.00',
	quantity: '10',
});

pagseguro.sender({
	name: 'Sr. Foobar',
	email: process.env.PAG_SEGURO_BUYER,
	phone: {
		areaCode: '51',
		number: '12345678',
	},
});

pagseguro.shipping({
	type: 1,
	name: 'Sr. Foobar',
	email: process.env.PAG_SEGURO_BUYER,
	address: {
		street: 'Av. Foobar',
		number: '10',
		city: 'Foobar',
		state: 'Foobar',
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

// pagseguro.transaction('transaction_token', async (success, response) => {
// 	if (success) {
// 		console.log('Success');
// 		console.log(response);
// 		const answer = await xmlParse(response);
// 		console.log(answer);
// 	} else {
// 		console.log('Error');
// 		console.error(response);
// 	}
// });

// pagseguro.notification('notification_token', async (success, response) => {
// 	if (success) {
// 		console.log('Success');
// 		console.log(response);
// 		const answer = await xmlParse(response);
// 		console.log(answer);
// 	} else {
// 		console.log('Error');
// 		console.error(response);
// 	}
// });
