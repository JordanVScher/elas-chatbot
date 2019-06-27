// Module for sending attachments to bot
// context is the context from bot.onEvent
// links is the object from flow.js from the respective dialog

const { capQR } = require('./helper');

async function buildButton(url, title) { return [{ type: 'web_url', url, title }]; } module.exports.buildButton = buildButton;

// sends one card with an image and link
module.exports.sendCardWithLink = async function sendCardWithLink(context, cardData, url, text) {
	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements: [
				{
					title: cardData.title,
					subtitle: (text && text !== '') ? text : cardData.sub,
					image_url: cardData.imageLink,
					default_action: {
						type: 'web_url',
						url,
						messenger_extensions: 'false',
						webview_height_ratio: 'full',
					},
				},
			],
		},
	});
};

module.exports.cardLinkNoImage = async (context, title, url) => {
	await context.sendAttachment({
		type: 'template',
		payload: { template_type: 'generic', elements: [{ title, subtitle: ' ', buttons: [{ type: 'web_url', url, title }] }] },
	});
};

module.exports.sendCardWithout = async function sendCardWithLink(context, cardData) {
	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements: [
				{
					title: cardData.title,
					subtitle: cardData.sub,
					image_url: cardData.imageLink,
					// default_action: {
					// 	type: 'web_url',
					// 	url,
					// 	messenger_extensions: 'false',
					// 	webview_height_ratio: 'full',
					// },
				},
			],
		},
	});
};

module.exports.sendAtividade2Cards = async (context, cards, cpf) => {
	const elements = [];

	cards.forEach(async (element) => {
		elements.push({
			title: element.title,
			subtitle: element.subtitle,
			image_url: element.image_url,
			default_action: {
				type: 'web_url',
				url: element.url.replace('CPFRESPOSTA', cpf),
				// messenger_extensions: 'false',
				// webview_height_ratio: 'full',
			},
			buttons: [
				{ type: 'web_url', url: element.url.replace('CPFRESPOSTA', cpf), title: 'Fazer Atividade' }],
		});
	});


	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements,
		},
	});
};

module.exports.sendSequenceMsgs = async (context, msgs, buttonTitle) => {
	for (let i = 0; i < msgs.length; i++) {
		if (msgs[i] && msgs[i].text && msgs[i].url) {
			await context.sendButtonTemplate(msgs[i].text, await buildButton(msgs[i].url, buttonTitle));
		}
	}
};

// get quick_replies opject with elements array
// supossed to be used with menuOptions and menuPostback for each dialog on flow.js

module.exports.getQR = async (opt) => {
	const elements = [];
	const firstArray = opt.menuOptions;

	firstArray.forEach(async (element, index) => {
		elements.push({
			content_type: 'text',
			title: await capQR(element),
			payload: opt.menuPostback[index],
		});
	});

	return { quick_replies: elements };
};

async function getVoltarQR(lastDialog) {
	let lastPostback = '';

	if (lastDialog === 'optDenun') {
		lastPostback = 'goBackMenu';
	} else {
		lastPostback = lastDialog;
	}

	return {
		content_type: 'text',
		title: 'Voltar',
		payload: lastPostback,
	};
}

module.exports.getVoltarQR = getVoltarQR;
module.exports.getErrorQR = async (opt, lastDialog) => {
	const elements = [];
	const firstArray = opt.menuOptions;

	firstArray.forEach((element, index) => {
		elements.push({
			content_type: 'text',
			title: element,
			payload: opt.menuPostback[index],
		});
	});

	elements.push(await getVoltarQR(lastDialog));

	console.log('ERRORQR', elements);

	return { quick_replies: elements };
};

module.exports.sendShare = async (context, links) => {
	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements: [
				{
					title: links.siteTitle,
					subtitle: links.siteSubTitle,
					image_url: links.imageURL,
					item_url: links.siteURL,
					buttons: [{
						type: 'element_share',
					}],
				},
			],
		},
	});
};
