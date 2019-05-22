
require('dotenv').config();

const { MessengerBot, FileSessionStore, withTyping } = require('bottender');
const { createServer } = require('bottender/restify');
const corsMiddleware = require('restify-cors-middleware');
const restify = require('restify');
const { newSurveyResponse } = require('./sm_help');
const pgAPI = require('./pg_api');

const config = require('./bottender.config.js').messenger;

const bot = new MessengerBot({
	// mapPageToAccessToken,
	accessToken: config.accessToken,
	appSecret: config.appSecret,
	verifyToken: config.verifyToken,
	sessionStore: new FileSessionStore(),
});

bot.setInitialState({});

const cors = corsMiddleware({
	origins: ['*'],
	allowHeaders: ['Authorization'],
	exposeHeaders: ['Authorization'],
});


const messageWaiting = eval(process.env.WITH_TYPING); // eslint-disable-line no-eval
if (messageWaiting) { bot.use(withTyping({ delay: messageWaiting })); }

const handler = require('./handler');

bot.onEvent(handler);

const server = createServer(bot, { verifyToken: config.verifyToken });

server.use(require('restify-pino-logger')());

server.pre(cors.preflight);
server.use(cors.actual);

server.use(restify.plugins.queryParser());
server.use(restify.plugins.fullResponse());
server.use(restify.plugins.bodyParser({
	requestBodyOnGet: true,
	jsonBodyParser: true,
}));

server.head('/webhook', async (req, res) => {
	res.status(200);
	res.send();
});

server.use(
	(req, res, next) => {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Headers', 'X-Requested-With');
		return next();
	},
);

server.post('/webhook', async (req, res) => {
	// console.log(req.headers);
	const body = JSON.parse(req.body);
	if (body && body.filter_type === 'survey' && body.event_type === 'response_completed') {
		newSurveyResponse(body);
	}
	res.status(200);
	res.send();
});

server.post('/pagamento', async (req, res) => {
	const date = new Date();
	console.log('chegou no pagamento no post', date);

	console.log(JSON.parse(req.body));
	console.log(JSON.parse(req.params));
	await pgAPI.handleNotification(JSON.parse(req.body));

	res.status(200);
	res.send();
});

server.get('/pagamento', async (req, res) => {
	res.header('Access-Control-Allow-Origin', 'https://sandbox.pagseguro.uol.com.br');
	const date = new Date();
	console.log('chegou no pagamento no get', date);

	// console.log(JSON.parse(req.body));
	// console.log(JSON.parse(req.params));

	res.status(200);
	res.send();
});

server.post('/redirecionamento', async (req, res) => {
	res.header('Access-Control-Allow-Origin', 'https://sandbox.pagseguro.uol.com.br');
	console.log('chegou no redirecionamento no post');

	// console.log(JSON.parse(req.body));
	// console.log(JSON.parse(req.params));

	res.status(200);
	res.send();
});

server.listen(process.env.API_PORT, () => {
	console.log(`Server is running on ${process.env.API_PORT} port...`);
	console.log(`App: ${process.env.APP} & Page: ${process.env.PAGE}`);
	console.log(`MA User: ${process.env.MA_USER}`);
});
