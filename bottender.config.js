
const { withTyping } = require('bottender');
const { getStarted } = require('./app/utils/flow');

const messageWaiting = eval(process.env.WITH_TYPING); // eslint-disable-line no-eval

const { getChatbotData } = require('./app/chatbot_api');

const mapPageToAccessToken = async (pageId) => {
	const perfilData = await getChatbotData(pageId);
	return perfilData && perfilData.fb_access_token ? perfilData.fb_access_token : process.env.MESSENGER_ACCESS_TOKEN;
};

module.exports = {
	channels: {
		messenger: {
			enabled: true,
			path: '/webhooks/messenger',
			pageId: process.env.MESSENGER_PAGE_ID,
			accessToken: process.env.MESSENGER_ACCESS_TOKEN,
			appId: process.env.MESSENGER_APP_ID,
			appSecret: process.env.MESSENGER_APP_SECRET,
			verifyToken: process.env.MESSENGER_VERIFY_TOKEN,
			mapPageToAccessToken,
			profile: {
				getStarted: {
					payload: 'greetings',
				},
				greeting: [
					{
						locale: 'default',
						text: getStarted,
					},
				],
				persistentMenu: [
					{
						locale: 'default',
						composerInputDisabled: false,
						callToActions: [
							{
								type: 'postback',
								title: 'Ir para o início',
								payload: 'greetings',
							},
							{
								type: 'nested',
								title: 'Notificações 🔔',
								call_to_actions: [
									{
										type: 'postback',
										title: 'Ligar Notificações 👌',
										payload: 'notificationOn',
									},
									{
										type: 'postback',
										title: 'Parar Notificações 🛑',
										payload: 'notificationOff',
									},
								],
							},
						],
					},
				],
			},
		},
	},

	session: {
		driver: 'file',
		stores: {
			file: {
				dirname: '.sessions',
			},
		},
	},

	plugins: [withTyping({ delay: messageWaiting || 0 })],
};
