const { sequelize } = require('../server/models/index');
const { moment } = require('./helper');

if (process.env.TEST !== 'true') {
	sequelize.authenticate().then(() => {
		console.log('PSQL Connection has been established successfully.');
	}).catch((err) => {
		console.error('Unable to connect to the database:', err);
	});
}

async function getAlunaFromPDF(cpf) {
	const aluna = await sequelize.query(`
	SELECT * from alunos WHERE cpf = '${cpf}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${cpf} successfully!`);
		return results && results[0] && results[0].turma ? results[0] : false;
	}).catch((err) => {
		console.error('Error on upsertAluno => ', err);
	});

	return aluna;
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

async function insertIndicacao(alunaID, userData, familiar) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	const id = await sequelize.query(`
	INSERT INTO "indicacao_avaliadores" (aluno_id, nome, email, telefone, 
		familiar, relacao_com_aluna, created_at, updated_at)
	  VALUES ('${alunaID}', '${userData.nome || ''}', '${userData.email}', '${userData.tele || ''}', 
	  '${familiar}', '${userData.relacao || ''}','${date}', '${date}')
	RETURNING id, email;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${userData.email} successfully!`);
		return results && results[0] ? results[0] : false;
	}).catch((err) => {
		console.error('Error on insertIndicacao => ', err);
	});

	return id;
}

async function insertFamiliar(alunaID, userData) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	const id = await sequelize.query(`
	INSERT INTO "indicacao_familiares" (aluno_id, nome, relacao_com_aluna, email, telefone, created_at, updated_at)
	  VALUES ('${alunaID}', '${userData.nome}', '${userData.relacao}', '${userData.email}', '${userData.tele}', '${date}', '${date}')
	RETURNING id, email;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${userData.email} successfully!`);
		return results && results[0] ? results[0] : false;
	}).catch((err) => {
		console.error('Error on insertFamiliar => ', err);
	});

	return id;
}

async function getAluno(cpf) {
	const id = await sequelize.query(`
	SELECT id, cpf, email, turma, nome_completo as nome FROM alunos WHERE cpf = '${cpf}' LIMIT 1;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${cpf}'s id successfully!`);
		return results && results[0] ? results[0] : false;
	}).catch((err) => {
		console.error('Error on getAluno => ', err);
	});

	return id;
}

async function getAlunoRespostas(cpf) {
	const aluna = await sequelize.query(`
	SELECT
			ALUNOS.id id,
			ALUNOS.nome_completo nome,
			RESPOSTAS.pre pre,
			RESPOSTAS.pos pos
	FROM
			alunos ALUNOS
	INNER JOIN alunos_respostas RESPOSTAS ON ALUNOS.id = RESPOSTAS.aluno_id
	WHERE ALUNOS.cpf = '${cpf}' ;
`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${cpf}'s respostas successfully!`);
		return results && results[0] ? results[0] : false;
	}).catch((err) => {
		console.error('Error on getAlunoRespostas => ', err);
	});

	return aluna;
}

async function getIndicadoRespostas(cpf) {
	const indicado = await sequelize.query(`
	SELECT
			INDICADOS.id,
			RESPOSTAS.pre pre,
			RESPOSTAS.pos pos
	FROM
			alunos ALUNOS INNER JOIN indicacao_avaliadores INDICADOS ON ALUNOS.id = INDICADOS.aluno_id
			INNER JOIN indicados_respostas RESPOSTAS ON RESPOSTAS.indicado_id = INDICADOS.id
	WHERE ALUNOS.cpf = '${cpf}' ;
`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${cpf}'s respostas successfully!`);
		return results || false;
	}).catch((err) => {
		console.error('Error on getIndicadoRespostas => ', err);
	});

	return indicado;
}

// 3 booleans, each refine the search.
// familiar = select only indicados that are familiar
// preEmpty = if true, select only users that have answered pre already
// posEmpty = if true, select only users that have answered pos already
// if preEmpty or posEmpty are null, ignore this refinement
async function getIndicadoFromAluna(AlunaID, familiar, pre, pos) {
	let queryComplement = '';
	if (familiar === true) { queryComplement += 'AND INDICADOS.familiar = \'true\' ';	}
	if (pre === true) { queryComplement += 'AND RESPOSTAS.pre IS NOT NULL '; } else if (pre === false) { queryComplement += 'AND RESPOSTAS.pre IS NULL ';	}
	if (pos === true) { queryComplement += 'AND RESPOSTAS.pos IS NOT NULL '; } else if (pos === false) { queryComplement += 'AND RESPOSTAS.pos IS NULL '; }

	console.log(`SELECT * FROM indicacao_avaliadores INDICADOS INNER JOIN indicados_respostas RESPOSTAS ON INDICADOS.id = RESPOSTAS.indicado_id
	WHERE INDICADOS.aluno_id = '${AlunaID}' ${queryComplement};`);

	const indicado = await sequelize.query(`
	SELECT * FROM 
	indicacao_avaliadores INDICADOS INNER JOIN indicados_respostas RESPOSTAS ON INDICADOS.id = RESPOSTAS.indicado_id
	WHERE aluno_id = '${AlunaID}' ${queryComplement};
`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${AlunaID}'s indicados successfully!`);
		return results || false;
	}).catch((err) => {
		console.error('Error on getIndicadoFromAluna => ', err);
	});

	return indicado || [];
}

async function upsertPrePos(userID, response, column) {
	// column can be either pre or pos
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	INSERT INTO "alunos_respostas" (aluno_id, ${column}, created_at, updated_at)
	VALUES ('${userID}', '${response}', '${date}', '${date}')
	ON CONFLICT (aluno_id)
  DO UPDATE
		SET aluno_id = '${userID}', ${column} = '${response}', updated_at = '${date}';;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${userID}'s ${column} successfully!`);
	}).catch((err) => {
		console.error('Error on upsertPreCadastro => ', err);
	});
}

async function upsertPrePos360(userID, response, column) {
	// column can be either pre or pos
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	INSERT INTO "indicados_respostas" (indicado_id, ${column}, created_at, updated_at)
	VALUES ('${userID}', '${response}', '${date}', '${date}')
	ON CONFLICT (indicado_id)
  DO UPDATE
		SET indicado_id = '${userID}', ${column} = '${response}', updated_at = '${date}';;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${userID}'s ${column} successfully!`);
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

	const result = await sequelize.query(`
	INSERT INTO "pagamentos" (documento_tipo, documento_valor, email, id_produto, id_transacao, created_at, updated_at)
  VALUES ('${documentoTipo}', '${documentoValor}', '${email}', '${productId}', '${transctionId}', '${date}', '${date}')
  ON CONFLICT (id_transacao)
  DO UPDATE
		SET documento_tipo = '${documentoTipo}', documento_valor = '${documentoValor}', email = '${email}', updated_at = '${date}'
	RETURNING id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${email} successfully!`);
		return results && results[0] ? results[0] : false;
	}).catch((err) => {
		console.error('Error on upsertPagamento => ', err);
	});

	return result;
}
async function updateAlunoOnPagamento(pagamentoId, alunoId) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	UPDATE pagamentos
		SET aluno_id = '${alunoId}', updated_at = '${date}'
	WHERE
   id = '${pagamentoId}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Updated pagamento ${pagamentoId} successfully!`);
	}).catch((err) => {
		console.error('Error on updateAlunoOnPagamento => ', err);
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
		console.error('Error on getUserTurma => ', err);
	});

	if (result && result[0] && result[0].turma && result[0].nome) { return result[0];	}
	return false;
}

async function getAlunasFromTurma(turma) {
	const result = await sequelize.query(`
	SELECT ALUNO.id, ALUNO.cpf, ALUNO.turma, ALUNO.nome_completo, ALUNO.email, BOT_USER.fb_id
	FROM alunos ALUNO
	LEFT JOIN chatbot_users BOT_USER ON BOT_USER.cpf = ALUNO.cpf
	WHERE ALUNO.turma = '${turma}'
	ORDER BY BOT_USER.fb_id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${turma} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getAlunasFromTurma => ', err);
	});

	return result || false;
}


module.exports = {
	upsertUser,
	getAlunaFromPDF,
	upsertPagamento,
	upsertAluno,
	linkUserToCPF,
	checkCPF,
	getUserTurma,
	upsertPrePos,
	upsertPrePos360,
	updateAtividade,
	insertIndicacao,
	insertFamiliar,
	getAluno,
	getAlunoRespostas,
	getIndicadoRespostas,
	getAlunasFromTurma,
	getIndicadoFromAluna,
	updateAlunoOnPagamento,
};
