
const baseNotification = {
	id: 705,
	notification_type: 1,
	aluno_id: 120,
	indicado_id: null,
	when_to_send: '',
	sent_at: null,
	error: null,
};

const baseRecipientIndicado = {
	id: 1,
	aluno_id: 1,
	nome: 'Foo Bar',
	email: 'foobar@foo.com',
	telefone: '12345678910',
	familiar: false,
	// relacao_com_aluna: 'Teste',
	'respostas.id': 5,
	'respostas.indicado_id': 1,
	// 'respostas.pre': { perguntas: 'respostas' },
	// 'respostas.pos': { perguntas: 'respostas' },
	'aluna.id': 120,
	'aluna.nome_completo': 'Barfoo',
	'aluna.cpf': '7418529355',
	'aluna.email': 'Barfoo@bar.com',
	'aluna.turma': 'TURMA1',
	mod1: '2019-07-30T16:12:00.000Z',
	mod2: '2019-08-15T16:43:00.000Z',
	mod3: '2019-09-10T15:25:00.000Z',
	local: 'Vila do Teste',
	moduloAvisar: 3,
};

module.exports = {
	baseNotification, baseRecipientIndicado,
};
