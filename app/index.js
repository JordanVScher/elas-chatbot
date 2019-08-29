require('dotenv').config();

const { MessengerBot, FileSessionStore, withTyping } = require('bottender');
const { createServer } = require('bottender/restify');
const corsMiddleware = require('restify-cors-middleware');
const restify = require('restify');
const { newSurveyResponse } = require('./utils/sm_help');
const pgAPI = require('./pg_api');
const { sendNotificationCron } = require('./utils/notificationSendQueue');
const { updateTurmasCron } = require('./utils/turma');
const { associatesLabelToUser } = require('./utils/postback');

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

server.use(
	(req, res, next) => {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Headers', 'X-Requested-With');
		return next();
	},
);

// confirma webhook setup from survey monkey
server.head('/webhook', async (req, res) => {
	res.status(200);
	res.send();
});

server.get('/webhook', async (req, res) => {
	res.status(200);
	res.send();
});

// receives new event from survey monkey webhook
server.post('/webhook', async (req, res) => {
	console.log('No webhook das respostas');

	const body = JSON.parse(req.body);
	if (body && body.filter_type === 'survey' && body.event_type === 'response_completed') {
		newSurveyResponse(body);
	}
	res.status(200);
	res.send();
});


server.post('/pagamento', async (req, res) => {
	console.log('chegou no pagamento no post');
	await pgAPI.handlePagamento(req.body);
	res.status(200);
	res.send();
});

server.post('/add-admin', async (req, res) => {
	console.log('chegou no add-admin');
	const { user } = req.body;
	const { labelID } = req.body;

	const response = await associatesLabelToUser(user, labelID);
	res.status(200);
	res.send(response);
});


server.listen(process.env.API_PORT, () => {
	console.log(`Server is running on ${process.env.API_PORT} port...`);
	console.log(`App: ${process.env.APP} & Page: ${process.env.PAGE}`);
	console.log(`MA User: ${process.env.MA_USER}`);
	console.log(`Crontab sendNotificationCron is running? => ${sendNotificationCron.running}`);
	console.log(`Crontab updateTurmasCron is running? => ${updateTurmasCron.running}`);
});
