const { sequelize } = require('../server/models/index');
const { moment } = require('./helper');

if (process.env.TEST !== 'true') {
	sequelize.authenticate().then(() => {
		console.log('PSQL Connection has been established successfully.');
	}).catch((err) => {
		console.error('Unable to connect to the database:', err);
	});
}

async function upsertAluno(nome, cpf, turma, email) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	INSERT INTO "alunos" (nome_completo, cpf, turma, email, created_at, updated_at)
  VALUES ('${nome}', '${cpf}', '${turma}', '${email}', '${date}', '${date}')
	ON CONFLICT (cpf)
  DO UPDATE
  	SET nome_completo = '${nome}', turma = '${turma}', email = '${email}', updated_at = '${date}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${nome} successfully!`);
	}).catch((err) => {
		console.error('Error on upsertAluno => ', err);
	});
}

async function upsertUser(FBID, userName) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	INSERT INTO "chatbot_users" (fb_id, user_name, created_at, updated_at)
  VALUES ('${FBID}', '${userName}', '${date}', '${date}')
  ON CONFLICT (fb_id)
  DO UPDATE
    SET user_name = '${userName}', updated_at = '${date}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${userName} successfully!`);
	}).catch((err) => {
		console.error('Error on upsertUser => ', err);
	});
}

async function upsertPagamento(documentoTipo, documentoValor, email, productId, transctionId) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	INSERT INTO "pagamentos" (documento_tipo, documento_valor, e_mail, id_produto, id_transacao, created_at, updated_at)
  VALUES ('${documentoTipo}', '${documentoValor}', '${email}', '${productId}', '${transctionId}', '${date}', '${date}')
  ON CONFLICT (id_transacao)
  DO UPDATE
    SET documento_tipo = '${documentoTipo}', documento_valor = '${documentoValor}', e_mail = '${email}', updated_at = '${date}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${email} successfully!`);
	}).catch((err) => {
		console.error('Error on upsertUser => ', err);
	});
}

// ----------------------------------------------------------

// CREATE TABLE chatbot_users(
// 	id SERIAL PRIMARY KEY,
// 	fb_id BIGINT UNIQUE,
// 	user_name TEXT NOT NULL,
// 	matricula INTEGER,
// 	cpf TEXT,
// 	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
// 	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
// );

// CREATE TABLE pagamentos(
// 	id SERIAL PRIMARY KEY,
// 	e_mail text NOT NULL,
// 	documento_tipo text NOT NULL,
// 	documento_valor text NOT NULL,
// 	id_produto INTEGER,
// 	id_transacao TEXT NOT NULL UNIQUE,
// 	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
// 	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
// );

// CREATE TABLE alunos(
// 	id SERIAL PRIMARY KEY,
// 	nome_completo TEXT,
// 	cpf TEXT UNIQUE,
// 	turma TEXT,
// 	email TEXT,
// 	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
// 	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
// );

module.exports = {
	upsertUser, upsertPagamento, upsertAluno,
};
