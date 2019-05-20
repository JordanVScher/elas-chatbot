require('dotenv').config();

const { MessengerBot, FileSessionStore, withTyping } = require('bottender');
const { createServer } = require('bottender/restify');
const restify = require('restify');
// const sm = require('./sm_help');

const config = require('./bottender.config.js').messenger;

const bot = new MessengerBot({
	// mapPageToAccessToken,
	accessToken: config.accessToken,
	appSecret: config.appSecret,
	verifyToken: config.verifyToken,
	sessionStore: new FileSessionStore(),
});

bot.setInitialState({});


const messageWaiting = eval(process.env.WITH_TYPING); // eslint-disable-line no-eval
if (messageWaiting) { bot.use(withTyping({ delay: messageWaiting })); }

const handler = require('./handler');

bot.onEvent(handler);

const server = createServer(bot, { verifyToken: config.verifyToken });

server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser({
	requestBodyOnGet: true,
	jsonBodyParser: true,
}));

server.head('/webhook', async (req, res) => {
	res.status(200);
	res.send();
});

server.post('/webhook', async (req, res) => {
	// console.log(req.headers);
	const body = JSON.parse(req.body);
	if (body && body.filter_type === 'survey' && body.event_type === 'response_completed') {
		// sm.newSurveyResponse(body);
	}
	res.status(200);
	res.send();
});

server.listen(process.env.API_PORT, () => {
	console.log(`Server is running on ${process.env.API_PORT} port...`);
	console.log(`App: ${process.env.APP} & Page: ${process.env.PAGE}`);
	console.log(`MA User: ${process.env.MA_USER}`);
});
