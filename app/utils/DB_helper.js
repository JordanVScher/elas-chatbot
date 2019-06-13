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

	const id = await sequelize.query(`
	INSERT INTO "alunos" (nome_completo, cpf, turma, email, created_at, updated_at)
  VALUES ('${nome}', '${cpf}', '${turma}', '${email}', '${date}', '${date}')
	ON CONFLICT (cpf)
  DO UPDATE
		SET nome_completo = '${nome}', turma = '${turma}', email = '${email}', updated_at = '${date}'
		RETURNING id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${nome} successfully!`);
		return results && results[0] && results[0].id ? results[0].id : false;
	}).catch((err) => {
		console.error('Error on upsertAluno => ', err);
	});

	return id;
}

async function getAlunoId(cpf) {
	const id = await sequelize.query(`
	SELECT id FROM alunos WHERE cpf = '${cpf}' LIMIT 1;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${cpf}'s id successfully!`);
		return results && results[0] && results[0].id ? results[0].id : false;
	}).catch((err) => {
		console.error('Error on getAlunoId => ', err);
	});

	return id;
}

async function upsertPreCadastro(userID, response) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	INSERT INTO "alunos_respostas" (aluno_id, pre, created_at, updated_at)
	VALUES ('${userID}', '${response}', '${date}', '${date}')
	ON CONFLICT (aluno_id)
  DO UPDATE
		SET aluno_id = '${userID}', pre = '${response}', updated_at = '${date}';;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${userID}'s precadastro successfully!`);
	}).catch((err) => {
		console.error('Error on upsertPreCadastro => ', err);
	});
}
async function updateAtividade(userID, column, answered) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	INSERT INTO "alunos_respostas" (aluno_id, ${column}, created_at, updated_at)
	VALUES ('${userID}', '${answered}', '${date}', '${date}')
	ON CONFLICT (aluno_id)
  DO UPDATE
		SET aluno_id = '${userID}', ${column} = '${answered}', updated_at = '${date}';;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${userID}'s ${column} successfully!`);
	}).catch((err) => {
		console.error('Error on updateAtividade => ', err);
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
	INSERT INTO "pagamentos" (documento_tipo, documento_valor, email, id_produto, id_transacao, created_at, updated_at)
  VALUES ('${documentoTipo}', '${documentoValor}', '${email}', '${productId}', '${transctionId}', '${date}', '${date}')
  ON CONFLICT (id_transacao)
  DO UPDATE
    SET documento_tipo = '${documentoTipo}', documento_valor = '${documentoValor}', email = '${email}', updated_at = '${date}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${email} successfully!`);
	}).catch((err) => {
		console.error('Error on upsertPagamento => ', err);
	});
}

async function checkCPF(cpf) {
	const result = await sequelize.query(`
	SELECT exists (SELECT 1 FROM alunos WHERE cpf = '${cpf}' LIMIT 1);
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Checked ${cpf} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on checkCPF => ', err);
	});

	if (result && result[0] && result[0].exists === true) { return true; }
	return false;
}

async function linkUserToCPF(FBID, cpf) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	UPDATE chatbot_users
		SET cpf = '${cpf}', updated_at = '${date}'
	WHERE
   fb_id = '${FBID}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${FBID}'s cpf successfully!`);
	}).catch((err) => {
		console.error('Error on linkUserToCPF => ', err);
	});
}

async function getUserTurma(FBID) {
	const result = await sequelize.query(`
	SELECT ALUNO.turma, ALUNO.nome_completo AS nome
	FROM alunos ALUNO
	INNER JOIN chatbot_users BOT_USER ON BOT_USER.cpf = ALUNO.cpf
	WHERE BOT_USER.fb_id = '${FBID}'
	ORDER BY BOT_USER.fb_id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${FBID}'s turma successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on linkUserToCPF => ', err);
	});

	if (result && result[0] && result[0].turma && result[0].nome) { return result[0];	}
	return false;
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
// 	email text NOT NULL,
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
	upsertUser, upsertPagamento, upsertAluno, linkUserToCPF, checkCPF, getUserTurma, upsertPreCadastro, updateAtividade, getAlunoId,
};
