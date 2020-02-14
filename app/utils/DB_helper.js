const { sequelize } = require('../server/models/index');
const { moment } = require('./helper');
const { sentryError } = require('./helper');
const { removeUndefined } = require('./admin_menu/CSV_format');
const indicados = require('../server/models').indicacao_avaliadores;
const indicadosRespostas = require('../server/models').indicados_respostas;
const alunosRespostas = require('../server/models').alunos_respostas;
const { alunos } = require('../server/models');

if (process.env.TEST !== 'true') {
	sequelize.authenticate().then(() => {
		console.log('PSQL Connection has been established successfully.');
	}).catch((err) => {
		console.error('Unable to connect to the database:', err);
	});
}

function addslashes(str) {
	if (typeof str !== 'string') return str;
	return str.replace(/'/g, `''`); // eslint-disable-line
}

async function changeAdminStatus(fbID, status) {
	const updatedUser = await sequelize.query(`
		UPDATE chatbot_users SET is_admin = '${status}' WHERE fb_id = '${fbID}' RETURNING *;
		`).spread((results) => results).catch((err) => { sentryError('Erro em update changeAdminStatus =>', err); });
	return updatedUser;
}

async function getTurmaFromID(turmaID) {
	if (!turmaID) return { nome: 'Nenhuma' };
	const id = await sequelize.query(`
	SELECT * FROM turma where id = '${turmaID}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log('Got turma!');
		return results && results[0] ? results[0] : false;
	}).catch((err) => { sentryError('Erro em getTurmaFromID =>', err); });

	return id;
}


async function getTurmaID(turmaName) {
	if (!turmaName || turmaName === 'Nenhuma') return 0;
	turmaName = turmaName ? turmaName.toLowerCase() : '';
	const id = await sequelize.query(`
	SELECT id FROM turma where lower(nome) LIKE '${turmaName}%';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log('Got turma id!', results);
		return results && results[0] && results[0].id ? results[0].id : false;
	}).catch((err) => { sentryError('Erro em getTurmaID =>', err); });

	return id;
}

async function getFBIDFromAlunaID(AlunaID) {
	const id = await sequelize.query(`
	SELECT fb_id
	FROM chatbot_users BOT_USER
	LEFT JOIN alunos ALUNO ON BOT_USER.cpf = ALUNO.cpf
	WHERE ALUNO.id = '${AlunaID}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log('Got fb_id!', results);
		return results && results[0] && results[0].fb_id ? results[0].fb_id : false;
	}).catch((err) => { sentryError('Erro em getFBIDFromAlunaID =>', err); });

	return id;
}

async function removeAlunaFromTurma(alunaID) {
	const updatedUser = await sequelize.query(`
		UPDATE alunos SET turma_id = null WHERE id = '${alunaID}' returning *;
		`).spread((results) => (results && results[0] ? results[0] : false)).catch((err) => { sentryError('Erro em update removeAlunaFromTurma =>', err); });
	return updatedUser;
}

async function getTurmaName(turmaID) {
	if (!turmaID) return 'Nenhuma';
	const nome = await sequelize.query(`
	SELECT nome FROM turma where id = '${turmaID}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log('Got turma nome!');
		return results && results[0] && results[0].nome ? results[0].nome : false;
	}).catch((err) => { sentryError('Erro em getTurmaName =>', err); });

	return nome;
}

async function getTurmaInCompany(turmaID) {
	if (!turmaID) return false;
	const InCompany = await sequelize.query(`
	SELECT in_company FROM turma where id = '${turmaID}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log('Got turma InCompany!');
		return results && results[0] ? results[0].in_company : false;
	}).catch((err) => { sentryError('Erro em getTurmaInCompany =>', err); });

	return InCompany;
}

async function getAlunaFromCPF(cpf) {
	const aluna = await sequelize.query(`
	SELECT * from alunos WHERE cpf = '${cpf}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${cpf} successfully!`);
		return results && results[0] ? results[0] : false;
	}).catch((err) => { sentryError('Erro em getAlunaFromCPF =>', err); });

	if (aluna.turma_id) {
		aluna.turma = await getTurmaName(aluna.turma_id);
	}

	return aluna;
}

async function getAlunaRespostasWarning(turmaID) {
	const queryString = `
		SELECT ALUNOS.id as "aluno_id", ALUNOS.nome_completo as "nome_aluno", ALUNOS.telefone, ALUNOS.email, ALUNOS.cpf,
		ALUNOS.turma_id as "turma",	CHATBOT.fb_id as "fb_id_aluno", RESPOSTAS_ALUNOS.pre as "atividade_aluno_pre",
		RESPOSTAS_ALUNOS.pos as "atividade_aluno_pos", RESPOSTAS_ALUNOS.atividade_indicacao
		FROM alunos ALUNOS
		LEFT JOIN alunos_respostas RESPOSTAS_ALUNOS ON ALUNOS.id = RESPOSTAS_ALUNOS.aluno_id
		LEFT JOIN chatbot_users CHATBOT ON ALUNOS.cpf = CHATBOT.cpf
		WHERE ALUNOS.turma_id = '${turmaID}';`;
	const result = await sequelize.query(queryString).spread((results) => results).catch((err) => sentryError('Erro no getAlunaRespostasWarning =>', err));
	return result;
}

async function getIndicadoRespostasWarning(turma) {
	const queryString = `
		SELECT INDICADOS.id as "indicado_id", INDICADOS.aluno_id, INDICADOS.nome as "indicado_nome",
		INDICADOS.email as "indicado_mail", INDICADOS.telefone as "indicado_telefone",
		ALUNOS.turma_id as "turma", ALUNOS.nome_completo as "nome_aluno", ALUNOS.telefone, ALUNOS.email, ALUNOS.cpf,
		RESPOSTAS.pre as "atividade_indicado_pre", RESPOSTAS.pos as "atividade_indicado_pos"
		FROM indicacao_avaliadores INDICADOS
		LEFT JOIN indicados_respostas RESPOSTAS ON INDICADOS.id = RESPOSTAS.indicado_id
		LEFT JOIN alunos ALUNOS ON alunos.id = INDICADOS.aluno_id
		WHERE ALUNOS.turma_id = ${turma};`;
	const result = await sequelize.query(queryString).spread((results) => results).catch((err) => sentryError('Erro no getIndicadoRespostasWarning =>', err));
	return result;
}

async function getModuloDates() {
	const result = await sequelize.query(`
	SELECT id, nome, local, horario_modulo1 as modulo1, horario_modulo2 as modulo2, horario_modulo3 as modulo3 from turma
	where local IS NOT NULL AND horario_modulo1 IS NOT NULL AND horario_modulo2 IS NOT NULL AND horario_modulo3 IS NOT NULL;
	`).spread((results) => (results || false)).catch((err) => { sentryError('Erro em getModuloDates =>', err); });

	return result;
}

async function getAluno(cpf) {
	const id = await sequelize.query(`
	SELECT id, cpf, email, turma_id, nome_completo as nome FROM alunos WHERE cpf = '${cpf}' LIMIT 1;
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
			ALUNOS.email email,
			ALUNOS.turma_id turma_id,
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

async function getTurmaRespostas(turmaID) {
	const queryString = `
		SELECT RESPOSTAS_ALUNOS.pre as "pre", RESPOSTAS_ALUNOS.pos as "pos"
		FROM alunos ALUNOS
		LEFT JOIN alunos_respostas RESPOSTAS_ALUNOS ON ALUNOS.id = RESPOSTAS_ALUNOS.aluno_id
		LEFT JOIN chatbot_users CHATBOT ON ALUNOS.cpf = CHATBOT.cpf
		WHERE ALUNOS.turma_id = '${turmaID}' AND RESPOSTAS_ALUNOS.pre IS NOT NULL AND RESPOSTAS_ALUNOS.pos IS NOT NULL;`;
	const result = await sequelize.query(queryString).spread((results) => results).catch((err) => sentryError('Erro no getTurmaRespostas =>', err));
	return result;
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

async function getIndicadoRespostasAnswerNull(alunoID, column) {
	const indicado = await sequelize.query(`
	SELECT
			INDICADOS.id,
			INDICADOS.nome,
			RESPOSTAS.pre pre,
			RESPOSTAS.pos pos
	FROM
			alunos ALUNOS INNER JOIN indicacao_avaliadores INDICADOS ON ALUNOS.id = INDICADOS.aluno_id
			INNER JOIN indicados_respostas RESPOSTAS ON RESPOSTAS.indicado_id = INDICADOS.id
	WHERE ALUNOS.id = '${alunoID}' AND RESPOSTAS.${column} IS NULL;
`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${alunoID}'s respostas successfully!`);
		return results || false;
	}).catch((err) => { sentryError('Erro em getIndicadoRespostasWhereAnswerNull =>', err); });

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

async function getChatbotUser(alunaID) {
	const aluna = await sequelize.query(`
	SELECT *
	FROM chatbot_users BOT_USER
	LEFT JOIN alunos ALUNOS ON BOT_USER.cpf = ALUNOS.cpf
	WHERE ALUNOS.id = '${alunaID}'
`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${alunaID}'s aluna successfully!`);
		return results[0] || false;
	}).catch((err) => { sentryError('Erro em getChatbotUser =>', err); });

	return aluna;
}

async function getAlunaFromFBID(FBID) {
	const aluna = await sequelize.query(`
	SELECT ALUNO.id, ALUNO.cpf, ALUNO.turma_id, ALUNO.nome_completo, ALUNO.email, BOT_USER.fb_id
	FROM alunos ALUNO
	LEFT JOIN chatbot_users BOT_USER ON BOT_USER.cpf = ALUNO.cpf
	WHERE BOT_USER.fb_id = '${FBID}'
	ORDER BY BOT_USER.fb_id;
`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${FBID}'s aluna successfully!`);
		return results[0] || false;
	}).catch((err) => { sentryError('Erro em getIndicadoFromAluna =>', err); });

	return aluna;
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

async function getAlunasFromTurma(turma) {
	const result = await sequelize.query(`
	SELECT ALUNO.id, ALUNO.cpf, ALUNO.turma_id, ALUNO.nome_completo, ALUNO.email, BOT_USER.fb_id
	FROM alunos ALUNO
	LEFT JOIN chatbot_users BOT_USER ON BOT_USER.cpf = ALUNO.cpf
	WHERE ALUNO.turma_id = '${turma}'
	ORDER BY BOT_USER.fb_id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${turma} successfully!`);
		return results;
	}).catch((err) => { sentryError('Erro em getAlunasFromTurma =>', err); });

	return result || false;
}


async function getAlunasReport(turma) {
	const result = await sequelize.query(`
	SELECT ALUNO.id as "ID", ALUNO.cpf as "CPF", TURMA.nome as "Turma", ALUNO.nome_completo as "Nome Completo", ALUNO.email as "E-mail",
	ALUNO.telefone as "Telefone", ALUNO.rg as "RG", ALUNO.endereco as "Endereço", ALUNO.data_nascimento as "Data de Nascimento",
	ALUNO.contato_emergencia_nome as "Nome Contato de Emergência", ALUNO.contato_emergencia_email as "E-mail do Contato",
	ALUNO.contato_emergencia_fone as "Telefone do Contato",	ALUNO.contato_emergencia_relacao as "Relação com Contato",
	BOT_USER.fb_id as "ID Facebook", ALUNO.added_by_admin as "Adicionado pelo Admin",
	ALUNO.created_at as "Criado em", ALUNO.updated_at as "Atualizado em"
	FROM alunos ALUNO
	LEFT JOIN chatbot_users BOT_USER ON BOT_USER.cpf = ALUNO.cpf
	LEFT JOIN turma TURMA ON TURMA.id = ALUNO.turma_id
	WHERE ALUNO.turma_id = '${turma}'
	ORDER BY BOT_USER.fb_id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${turma} successfully!`);
		return results;
	}).catch((err) => { sentryError('Erro em getAlunasReport =>', err); });

	return { content: await removeUndefined(result), input: turma } || false;
}

async function getAlunasRespostasReport(turma) {
	const result = await sequelize.query(`
        SELECT RESPOSTA.id as "RESPOSTA ID", ALUNO.nome_completo as "Nome Completo", ALUNO.cpf as "ALUNA CPF", ALUNO.email as "ALUNA E-MAIL",
        RESPOSTA.pre as "Sondagem Pré", RESPOSTA.pos as "Sondagem Pós", RESPOSTA.atividade_1 as "Cadastro",
        RESPOSTA.avaliacao_modulo1 as "Avaliação Módulo 1", RESPOSTA.avaliacao_modulo2 as "Avaliação Módulo 2", RESPOSTA.avaliacao_modulo3 as "Avaliação Módulo 3"
        FROM alunos_respostas RESPOSTA
        LEFT JOIN alunos ALUNO ON ALUNO.id = RESPOSTA.aluno_id
        WHERE ALUNO.turma_id = ?
        ORDER BY RESPOSTA.id;
        `,
	{ replacements: [turma] }).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${turma} successfully!`);
		return results;
	}).catch((err) => { sentryError('Erro em getAlunasRespostasReport =>', err); });

	return { content: await removeUndefined(result), input: turma } || false;
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
	WHERE ALUNO.turma_id = '${turma}'
	ORDER BY ALUNO.id, INDICADO.id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got ${turma} successfully!`);
		return results;
	}).catch((err) => { sentryError('Error on getAlunasIndicadosReport => ', err);	});


	return { content: await removeUndefined(result), input: turma } || false;
}

async function addAlunaFromCSV(aluno) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	const columns = [];
	const values = [];
	const set = []; // for do update only

	if (aluno['Nome Completo']) {
		columns.push('nome_completo'); values.push(`"${addslashes(aluno['Nome Completo'])}"`); set.push(`${columns[columns.length - 1]} = ${values[values.length - 1]}`);
	}
	if (aluno.CPF) {
		columns.push('cpf'); values.push(`'${aluno.CPF}'`);
	}
	if (aluno['E-mail']) {
		columns.push('email'); values.push(`'${aluno['E-mail']}'`); set.push(`${columns[columns.length - 1]} = ${values[values.length - 1]}`);
	}
	if (aluno.turma_id) {
		columns.push('turma_id'); values.push(`'${aluno.turma_id}'`); set.push(`${columns[columns.length - 1]} = ${values[values.length - 1]}`);
	}

	columns.push('added_by_admin'); values.push('TRUE');
	columns.push('created_at'); values.push(`'${date}'`);
	columns.push('updated_at'); values.push(`'${date}'`); set.push(`${columns[columns.length - 1]} = ${values[values.length - 1]}`);

	const queryString = `INSERT INTO "alunos"(${columns.join(', ')})
	VALUES(${values.join(', ')})
	ON CONFLICT(cpf)
	DO UPDATE
	SET ${set.join(', ')}
	RETURNING *;`;

	const result = await sequelize.query(queryString).spread((results) => (results && results[0] ? results[0] : false)).catch((err) => sentryError('Erro no addAlunaFromCSV =>', err));

	return result;
}

async function buildTurmaDictionary() {
	const result = {};
	const turmas = await getModuloDates();
	turmas.forEach((element) => {
		result[element.id] = element.nome;
		result[element.nome] = element.id;
	});
	return result;
}


async function getTurmaIdFromAluno(alunoID) {
	const result = await sequelize.query(`SELECT turma_id FROM alunos	WHERE id = '${alunoID}';`)
		.spread((results) => (results && results[0] ? results[0].turma_id : false)).catch((err) => { sentryError('Error on getAlunasIndicadosReport => ', err); });
	return result;
}

async function updateIndicadoNotification(indicadoID, notificationType, msg) {
	let error = null;
	if (msg) error = `'${JSON.stringify({ msg })}'`;

	const result = await sequelize.query(`UPDATE notification_queue SET error = ${error} WHERE indicado_id = '${indicadoID}' AND notification_type = '${notificationType}';`)
		.spread((results) => results).catch((err) => { sentryError('Error on getAlunasIndicadosReport => ', err); });
	return result;
}

async function getAllIndicadosFromAlunaID(alunoID) {
	const result = await sequelize.query(`SELECT * FROM indicacao_avaliadores	WHERE aluno_id = '${alunoID}';`)
		.spread((results) => results).catch((err) => { sentryError('Error on getAllIndicadosFromAlunaID => ', err); });
	return result;
}

async function getAlunaRespostaCadastro(alunoCPF) {
	const result = await sequelize.query(`
	SELECT RESPOSTAS.atividade_1 as "cadastro"
	FROM alunos_respostas AS RESPOSTAS
	LEFT JOIN alunos ALUNO ON ALUNO.id = RESPOSTAS.aluno_id
	WHERE ALUNO.cpf = '${alunoCPF}' LIMIT 1;
	`).spread((r) => r).catch((err) => { sentryError('Erro em getAlunaRespostaCadastro =>', err); });
	if (!result || result.length === 0 || result.cadastro === null || result[0].cadastro === null) {
		return false;
	}
	return result[0].cadastro;
}

async function getWhatsappFromID(turmaID) {
	const result = await sequelize.query(`
	SELECT whatsapp FROM turma where id = ${turmaID}
	`).spread((r) => (r && r[0] && r[0].whatsapp ? r[0].whatsapp : false)).catch((err) => { sentryError('Erro em getWhatsappFromID =>', err); });
	return result;
}

async function getDISCFromID(turmaID) {
	const result = await sequelize.query(`
	SELECT disc FROM turma where id = ${turmaID}
	`).spread((r) => (r && r[0] && r[0].disc ? r[0].disc : false)).catch((err) => { sentryError('Erro em getDISCFromID =>', err); });
	return result;
}
async function getAlunoRespostasAll(alunoID) {
	const result = await sequelize.query(`
	SELECT * FROM alunos_respostas where aluno_id = ${alunoID}
	`).spread((r) => (r[0])).catch((err) => { sentryError('Erro em getAlunoRespostasAll =>', err); });
	return result;
}

async function getNotificationTypes() {
	const result = await sequelize.query(`
	SELECT id, name, email_subject, email_text, chatbot_text, chatbot_quick_reply, chatbot_cards, attachment_name, attachment_link
	FROM notification_types order by id
	`).spread((r) => (r)).catch((err) => { sentryError('Erro em getNotificationTypes =>', err); });
	console.log(JSON.stringify(result, null, 2));
	return result;
}

async function getMissingCadastro() {
	const result = await sequelize.query(`
	SELECT ALUNO.id, ALUNO.nome_completo, ALUNO.email, ALUNO.cpf, TURMA.nome as turma_nome, PAGAMENTO.id as pagamento_id
	FROM alunos AS ALUNO
	INNER JOIN alunos_respostas RESPOSTAS ON ALUNO.id = RESPOSTAS.aluno_id
	INNER JOIN turma TURMA ON TURMA.id = ALUNO.turma_id
	LEFT JOIN pagamentos PAGAMENTO ON PAGAMENTO.aluno_id = ALUNO.id
	WHERE RESPOSTAS.atividade_1 is null;
	`).spread((r) => (r)).catch((err) => { sentryError('Erro em getNotificationTypes =>', err); });
	return result;
}

async function upsertIndicadosRespostas(indicadoID, column, answers) {
	const found = await indicadosRespostas.findOne({ where: { indicado_id: indicadoID }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findOne do indicadosRespostoas', err));
	if (found && found.id) {
		return indicadosRespostas.update({ [column]: answers }, { where: { id: found.id }, raw: true, plain: true, returning: true }).then((r) => r[1]).catch((err) => sentryError('Erro no update do indicadosRespostoas', err)); // eslint-disable-line object-curly-newline
	}

	return indicadosRespostas.create({ [column]: answers, indicado_id: indicadoID }).then((r) => r.dataValues).catch((err) => sentryError('Erro no create do indicadosRespostoas', err));
}

async function upsertIndicado(indicado) {
	const found = await indicados.findOne({ where: { aluno_id: indicado.aluno_id, email: indicado.email }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findOne do indicados', err));
	const values = {
		nome: indicado.nome, email: indicado.email, telefone: indicado.telefone, relacao_com_aluna: indicado.relacao_com_aluna, familiar: indicado.familiar,
	};

	if (typeof values.familiar !== 'boolean') delete values.familiar;
	if (found && found.id) {
		return indicados.update(values, { where: { id: found.id }, raw: true, plain: true, returning: true }).then((r) => r[1]).catch((err) => sentryError('Erro no update do indicados', err)); // eslint-disable-line object-curly-newline
	}
	values.aluno_id = indicado.aluno_id; // need for insertion
	return indicados.create(values).then((r) => r.dataValues).catch((err) => sentryError('Erro no create do indicados', err));
}


async function upsertAtividade(alunoID, column, answers) {
	const found = await alunosRespostas.findOne({ where: { aluno_id: alunoID }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findOne do alunosRespostas', err));
	if (found && found.id) {
		return alunosRespostas.update({ [column]: answers }, { where: { id: found.id } }).then((r) => r).catch((err) => sentryError('Erro no update do alunosRespostas', err));
	}

	return alunosRespostas.create({ [column]: answers }, { where: { id: found.id }, raw: true, plain: true, returning: true }).then((r) => r[1]).catch((err) => sentryError('Erro no create do alunosRespostas', err)); // eslint-disable-line object-curly-newline
}

async function upsertAlunoCadastro(aluno) {
	const found = await alunos.findOne({ where: { cpf: aluno.cpf }, raw: true }).then((r) => r).catch((err) => sentryError('Erro no findOne do alunos', err));
	const values = {
		nome_completo: aluno.nome_completo,
		cpf: aluno.cpf,
		turma_id: aluno.turma_id,
		email: aluno.email,
		rg: aluno.rg,
		telefone: aluno.telefone,
		endereco: aluno.endereco,
		data_nascimento: aluno.data_nascimento,
		contato_emergencia_nome: aluno.contato_emergencia_nome,
		contato_emergencia_fone: aluno.contato_emergencia_fone,
		contato_emergencia_email: aluno.contato_emergencia_email,
		contato_emergencia_relacao: aluno.contato_emergencia_relacao,
		added_by_admin: aluno.added_by_admin,
	};

	if (found && found.id) {
		return alunos.update(values, { where: { id: found.id }, raw: true, plain: true, returning: true }).then((r) => r[1]).catch((err) => sentryError('Erro no update do alunos', err)); // eslint-disable-line object-curly-newline
	}

	return alunos.create(values).then((r) => r.dataValues).catch((err) => sentryError('Erro no create do alunos', err));
}

module.exports = {
	upsertUser,
	getAlunaFromCPF,
	upsertAlunoCadastro,
	linkUserToCPF,
	checkCPF,
	getAluno,
	getAlunoRespostas,
	getAlunoRespostasAll,
	getIndicadoRespostas,
	getIndicadoRespostasAnswerNull,
	getAlunasFromTurma,
	getIndicadoFromAluna,
	updateAlunoOnPagamento,
	getAlunasReport,
	addAlunaFromCSV,
	getAlunasRespostasReport,
	getAlunasIndicadosReport,
	getTurmaID,
	getTurmaName,
	getTurmaInCompany,
	getModuloDates,
	getAlunaFromFBID,
	buildTurmaDictionary,
	getTurmaIdFromAluno,
	updateIndicadoNotification,
	getAlunaRespostasWarning,
	getIndicadoRespostasWarning,
	getChatbotUser,
	getTurmaFromID,
	changeAdminStatus,
	getFBIDFromAlunaID,
	removeAlunaFromTurma,
	getAllIndicadosFromAlunaID,
	getAlunaRespostaCadastro,
	getWhatsappFromID,
	getTurmaRespostas,
	getDISCFromID,
	getNotificationTypes,
	getMissingCadastro,
	upsertIndicadosRespostas,
	upsertIndicado,
	upsertAtividade,
};
