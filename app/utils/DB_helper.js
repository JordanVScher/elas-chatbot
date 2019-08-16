const { sequelize } = require('../server/models/index');
const { moment } = require('./helper');
const { sentryError } = require('./helper');

if (process.env.TEST !== 'true') {
	sequelize.authenticate().then(() => {
		console.log('PSQL Connection has been established successfully.');
	}).catch((err) => {
		console.error('Unable to connect to the database:', err);
	});
}


async function getTurmaID(turmaName) {
	const id = await sequelize.query(`
	SELECT id FROM turma where nome = '${turmaName}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log('Got turma id!');
		return results && results[0] && results[0].id ? results[0].id : false;
	}).catch((err) => { sentryError('Erro em getTurmaID =>', err); });

	return id;
}

async function getAlunaFromPDF(cpf) {
	const aluna = await sequelize.query(`
	SELECT * from alunos WHERE cpf = '${cpf}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${cpf} successfully!`);
		return results && results[0] && results[0].turma ? results[0] : false;
	}).catch((err) => { sentryError('Erro em getAlunaFromPDF =>', err); });

	return aluna;
}

async function upsertAluno(nome, cpf, turma, email) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');
	const turmaId = await getTurmaID(turma);

	const id = await sequelize.query(`
	INSERT INTO "alunos" (nome_completo, cpf, turma_id, email, created_at, updated_at)
  VALUES ('${nome}', '${cpf}', '${turmaId}', '${email}', '${date}', '${date}')
	ON CONFLICT (cpf)
  DO UPDATE
		SET nome_completo = '${nome}', turma_id = '${turmaId}', email = '${email}', updated_at = '${date}'
		RETURNING id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${nome} successfully!`);
		return results && results[0] && results[0].id ? results[0].id : false;
	}).catch((err) => { sentryError('Erro em upsertAluno =>', err); });


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
	}).catch((err) => { sentryError('Erro em insertIndicacao =>', err); });


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
	}).catch((err) => { sentryError('Erro em insertFamiliar =>', err); });


	return id;
}

async function getAluno(cpf) {
	const id = await sequelize.query(`
	SELECT id, cpf, email, turma, nome_completo as nome FROM alunos WHERE cpf = '${cpf}' LIMIT 1;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${cpf}'s id successfully!`);
		return results && results[0] ? results[0] : false;
	}).catch((err) => { sentryError('Erro em getAluno =>', err); });


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
	}).catch((err) => { sentryError('Erro em getAlunoRespostas =>', err); });


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
	}).catch((err) => { sentryError('Erro em getIndicadoRespostas =>', err); });

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
	}).catch((err) => { sentryError('Erro em getIndicadoFromAluna =>', err); });


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
	}).catch((err) => { sentryError('Erro em upsertPrePos =>', err); });
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
	}).catch((err) => { sentryError('Erro em upsertPrePos360 =>', err); });
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
	}).catch((err) => { sentryError('Erro em updateAtividade =>', err); });
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
	}).catch((err) => { sentryError('Erro em upsertUser =>', err); });
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
	}).catch((err) => { sentryError('Erro em updateAlunoOnPagamento =>', err); });
}

async function checkCPF(cpf) {
	const result = await sequelize.query(`
	SELECT exists (SELECT 1 FROM alunos WHERE cpf = '${cpf}' LIMIT 1);
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Checked ${cpf} successfully!`);
		return results;
	}).catch((err) => { sentryError('Erro em checkCPF =>', err); });

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
	}).catch((err) => { sentryError('Erro em linkUserToCPF =>', err); });
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
	}).catch((err) => { sentryError('Erro em getUserTurma =>', err); });


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
	}).catch((err) => { sentryError('Erro em getAlunasFromTurma =>', err); });


	return result || false;
}


async function getAlunasReport(turma) {
	const result = await sequelize.query(`
	SELECT ALUNO.id as "ID", ALUNO.cpf as "CPF", ALUNO.turma as "Turma", ALUNO.nome_completo as "Nome Completo", ALUNO.email as "E-mail", 
	ALUNO.created_at as "Criado em", 	BOT_USER.fb_id as "ID Facebook", ALUNO.updated_at as "Atualizado em"
	FROM alunos ALUNO
	LEFT JOIN chatbot_users BOT_USER ON BOT_USER.cpf = ALUNO.cpf
	WHERE ALUNO.turma = '${turma}'
	ORDER BY BOT_USER.fb_id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${turma} successfully!`);
		return results;
	}).catch((err) => { sentryError('Erro em getAlunasReport =>', err); });


	return { content: result, input: turma } || false;
}

async function getAlunasRespostasReport(turma) {
	const result = await sequelize.query(`
	SELECT RESPOSTA.id as "RESPOSTA ID", ALUNO.nome_completo as "Nome Completo", ALUNO.cpf as "ALUNO CPF", RESPOSTA.pre as "Sondagem Pré", RESPOSTA.pos as "Sondagem Pós",
	RESPOSTA.atividade_modulo1 as "Módulo 1", RESPOSTA.atividade_modulo2 as "Módulo 2", RESPOSTA.atividade_modulo3 as "Módulo 3",
	RESPOSTA.created_at as "Respondido em", RESPOSTA.updated_at as "Atualizado em"
	FROM alunos_respostas RESPOSTA
	LEFT JOIN alunos ALUNO ON ALUNO.id = RESPOSTA.aluno_id
	WHERE ALUNO.turma = '${turma}'
	ORDER BY RESPOSTA.id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${turma} successfully!`);
		return results;
	}).catch((err) => { sentryError('Erro em getAlunasRespostasReport =>', err); });

	return { content: result, input: turma } || false;
}

async function getAlunasIndicadosReport(turma) {
	const result = await sequelize.query(`
	SELECT INDICADO.id as "INDICADO ID", ALUNO.nome_completo as "Nome Aluna", ALUNO.cpf as "ALUNO CPF", INDICADO.nome as "Nome Completo",
	INDICADO.email as "E-mail", INDICADO.telefone as "Telefone", INDICADO.relacao_com_aluna as "Relação com Aluna",
	INDICADO.created_at as "Criado em", INDICADO.updated_at as "Atualizado em",
	RESPOSTAS.pre as "Pré-Avaliação", RESPOSTAS.pos as "Pós-Avaliação"
	FROM indicacao_avaliadores INDICADO
	LEFT JOIN alunos ALUNO ON ALUNO.id = INDICADO.aluno_id
	LEFT JOIN indicados_respostas RESPOSTAS ON INDICADO.id = RESPOSTAS.indicado_id
	WHERE ALUNO.turma = '${turma}'
	ORDER BY ALUNO.id, INDICADO.id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${turma} successfully!`);
		return results;
	}).catch((err) => { sentryError('Error on getAlunasIndicadosReport => ', err);	});


	return { content: result, input: turma } || false;
}

async function addAlunaFromCSV(aluno) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	const columns = [];
	const values = [];
	const set = [];

	if (aluno['Nome Completo']) {
		columns.push('nome_completo'); values.push(`'${aluno['Nome Completo']}'`); set.push(`${columns[columns.length - 1]} = ${values[values.length - 1]}`);
	}
	if (aluno.CPF) {
		columns.push('cpf'); values.push(`'${aluno.CPF}'`);
	}
	if (aluno['E-mail']) {
		columns.push('email'); values.push(`'${aluno['E-mail']}'`); set.push(`${columns[columns.length - 1]} = ${values[values.length - 1]}`);
	}

	columns.push('created_at'); values.push(`'${date}'`);
	columns.push('updated_at'); values.push(`'${date}'`); set.push(`${columns[columns.length - 1]} = ${values[values.length - 1]}`);

	const queryString = `INSERT INTO "alunos"(${columns.join(', ')})
	VALUES(${values.join(', ')})
	ON CONFLICT(cpf)
	DO UPDATE
	SET ${set.join(', ')}
	RETURNING id;`;

	const result = await sequelize.query(queryString).spread((results, metadata) => (results && results[0] ? results[0] : false)).catch((err) => { // eslint-disable-line no-unused-vars
		sentryError('Erro no addAlunaFromCSV =>', err);
		return { error: 'Valor inválido!' };
	});

	return result;
}


module.exports = {
	upsertUser,
	getAlunaFromPDF,
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
	getAlunasReport,
	addAlunaFromCSV,
	getAlunasRespostasReport,
	getAlunasIndicadosReport,
	getTurmaID,
};
