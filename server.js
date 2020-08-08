require('dotenv').config();

const restify = require('restify');
const { bottender } = require('bottender');
const corsMiddleware = require('restify-cors-middleware');
const pinoLogger = require('restify-pino-logger');

const { receiveAnswerEvent } = require('./app/utils/surveys/questionario_callback');
const pgAPI = require('./app/pg_api');
const requests = require('./requests');
const { cronLog } = require('./app/utils/cronjob');
const { sentryError } = require('./app/utils/helper');

const app = bottender({	dev: process.env.NODE_ENV !== 'production' });

const port = Number(process.env.API_PORT) || 5000;

const handle = app.getRequestHandler();

const cors = corsMiddleware({
	origins: ['*'],
	allowHeaders: ['Authorization'],
	exposeHeaders: ['Authorization'],
});

app.prepare().then(() => {
	const server = restify.createServer();

	server.use(pinoLogger());
	//
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

	server.get('/api', (req, res) => {
		res.send({ ok: true });
	});


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
		let event = null;
		let resultado = null;
		try {
			event = JSON.parse(req.body);
			if (event && event.filter_type === 'survey' && event.event_type === 'response_completed') {
				resultado = await receiveAnswerEvent(event);
			}

			res.status(200);
			res.send(resultado);
		} catch (error) {
			await sentryError('Erro no webhook das respostas', { error, body: req.body, event, resultado }); // eslint-disable-line object-curly-newline
			res.status(500);
			res.send();
		}
	});

	server.post('/pagamento', async (req, res) => {
		console.log('chegou no pagamento no post');
		await pgAPI.handlePagamento(req.body);
		res.status(200);
		res.send();
	});

	server.post('/add-label', async (req, res) => {
		await requests.addLabel(req, res);
	});

	server.get('/name-id', async (req, res) => {
		await requests.getNameFBID(req, res);
	});

	server.post('/add-missing-notification', async (req, res) => {
		await requests.addMissingNotification(req, res);
	});

	server.post('/add-new-notification', async (req, res) => {
		await requests.addNewQueue(req, res);
	});

	server.post('/send-notification-queue', async (req, res) => {
		await requests.sendNotificationQueue(req, res);
	});

	server.post('/data-queue', async (req, res) => {
		await requests.dataQueue(req, res);
	});

	server.post('/see-notification-queue', async (req, res) => {
		await requests.seeQueue(req, res);
	});

	server.post('/donna-mail', async (req, res) => {
		await requests.donnaMail(req, res);
	});

	server.post('/matricula-mail', async (req, res) => {
		await requests.matriculaMail(req, res);
	});

	server.post('/save-answer', async (req, res) => {
		await requests.saveNewAnswer(req, res);
	});

	server.post('/sync-answers', async (req, res) => {
		await requests.syncAnswers(req, res);
	});

	server.post('/log-queue', async (req, res) => {
		await requests.logMail(req, res);
	});

	server.post('/add-details', async (req, res) => {
		await requests.addQueueDetails(req, res);
	});

	server.post('/add-familiar-queue', async (req, res) => {
		await requests.addFamiliarQueue(req, res);
	});

	server.get('*', (req, res) => handle(req, res));
	server.post('*', (req, res) => handle(req, res));

	server.listen(port, (err) => {
		if (err) throw err;
		console.log(`Server is running on ${port} port...`);
		console.log(`App: ${process.env.APP} & Page: ${process.env.PAGE}`);
		console.log(`MA User: ${process.env.MA_USER}`);
		cronLog();
	});
});
