module.exports = {
	indicado: {
		id: 1,
		aluno_id: 1,
		nome: 'Bar',
		email: 'bar@foobar.com',
		telefone: '123123',
		familiar: true,
		relacao_com_aluna: 'Tio',
		'respostas.id': 1,
		'respostas.indicado_id': 1,
		'respostas.pre': { foobar: 'foobar' },
		'respostas.pos': { foobar: 'foobar' },
		'aluna.id': 1,
		'aluna.nome_completo': 'foo',
		'aluna.cpf': '123123123',
		'aluna.email': 'foo@foobar.com',
		'aluna.turma_id': 1,
		'aluna.rg': '321321',
		'aluna.telefone': '123123',
		'aluna.endereco': 'foobar',
		'aluna.data_nascimento': '12/12/1222',
		'aluna.contato_emergencia_nome': 'a',
		'aluna.contato_emergencia_fone': 'b',
		'aluna.contato_emergencia_email': 'c',
		'aluna.contato_emergencia_relacao': 'd',
		'aluna.added_by_admin': false,
	},


	pesquisaAluno: {
		id: 1,
		alunoID: 1,
		dataInicial: '2019-01-10T10:00:00.000Z',
		msgsEnviadas: 0,
		createdAt: '2019-10-24T16:07:06.206Z',
		updatedAt: '2019-10-24T16:10:06.109Z',
		error: { chatbot: '\nCoundnt send ,msg', eMail: '\nCoundnt send mail' },
		linksEnviados: {
			1: '', 2: '', 3: '', 4: '',
		},
	},

	notificationRules: [
		{
			is_active: true, notification_type: 1, modulo: 1, timeChange: [{ qtd: -11, type: 'days' }],
		},
		{
			is_active: true, notification_type: 2, modulo: 1, timeChange: [{ qtd: -10, type: 'days' }],
		},
		{ is_active: true, notification_type: 3, modulo: 1, timeChange: [{ qtd: -10, type: 'days' }], indicado: true, reminderDate: 6 }, // eslint-disable-line object-curly-newline
		{
			is_active: true, notification_type: 4, modulo: 1, timeChange: [{ qtd: 5, type: 'days' }],
		},
		{
			is_active: true, notification_type: 5, modulo: 1, timeChange: [{ qtd: 1, type: 'days' }, { qtd: 20, type: 'hours' }],
		}, // 20 hours after the second day of class
		{
			is_active: true, notification_type: 6, modulo: 2, timeChange: [{ qtd: -5, type: 'days' }],
		},
		{
			is_active: true, notification_type: 7, modulo: 2, timeChange: [{ qtd: -1, type: 'days' }],
		}, // on the second class
		{
			is_active: true, notification_type: 8, modulo: 3, timeChange: [{ qtd: -9, type: 'days' }, { qtd: 20, type: 'hours' }],
		}, // 20 hours after the second day of class
		{
			is_active: true, notification_type: 9, modulo: 3, timeChange: [{ qtd: -9, type: 'days' }],
		},
		{ is_active: true, notification_type: 10, modulo: 3, timeChange: [{ qtd: -7, type: 'days' }], indicado: true, reminderDate: 3 }, // eslint-disable-line object-curly-newline
		{
			is_active: true, notification_type: 11, modulo: 3, timeChange: [{ qtd: -6, type: 'days' }],
		},
		{ is_active: true, notification_type: 12, modulo: 3, timeChange: [{ qtd: -2, type: 'days' }], indicado: true, familiar: true }, // eslint-disable-line object-curly-newline
		{
			is_active: true, notification_type: 13, modulo: 3, timeChange: [{ qtd: 1, type: 'days' }],
		},
		{
			is_active: true, notification_type: 14, modulo: 1, timeChange: [{ qtd: -24, type: 'hours' }],
		},
		{
			is_active: true, notification_type: 14, modulo: 2, timeChange: [{ qtd: -24, type: 'hours' }],
		},
		{
			is_active: true, notification_type: 14, modulo: 3, timeChange: [{ qtd: -24, type: 'hours' }],
		},
		{ is_active: true, notification_type: 15, modulo: 1, timeChange: [{ qtd: -1, type: 'hours' }], sunday: false }, // eslint-disable-line object-curly-newline
		{ is_active: true, notification_type: 15, modulo: 1, timeChange: [{ qtd: 23, type: 'hours' }], sunday: true }, // eslint-disable-line object-curly-newline
		{ is_active: true, notification_type: 15, modulo: 2, timeChange: [{ qtd: -1, type: 'hours' }], sunday: false }, // eslint-disable-line object-curly-newline
		{ is_active: true, notification_type: 15, modulo: 2, timeChange: [{ qtd: 23, type: 'hours' }], sunday: true }, // eslint-disable-line object-curly-newline
		{ is_active: true, notification_type: 15, modulo: 3, timeChange: [{ qtd: -1, type: 'hours' }], sunday: false }, // eslint-disable-line object-curly-newline
		{ is_active: true, notification_type: 15, modulo: 3, timeChange: [{ qtd: 23, type: 'hours' }], sunday: true }, // eslint-disable-line object-curly-newline
		{
			is_active: true, notification_type: 16, modulo: 1, timeChange: [{ qtd: -2, type: 'days' }],
		},
		{
			is_active: true, notification_type: 16, modulo: 2, timeChange: [{ qtd: -2, type: 'days' }],
		},
		{
			is_active: true, notification_type: 16, modulo: 3, timeChange: [{ qtd: -2, type: 'days' }],
		},
		{ is_active: true, notification_type: 23, modulo: 1, timeChange: [{ qtd: -10, type: 'days' }], indicado: true, reminderDate: -6 }, // eslint-disable-line object-curly-newline
		{ is_active: true, notification_type: 24, modulo: 1, timeChange: [{ qtd: -10, type: 'days' }], indicado: true, reminderDate: 60 }, // eslint-disable-line object-curly-newline
		{
			is_active: true, notification_type: 25, modulo: 1, timeChange: [{ qtd: 60, type: 'days' }],
		},

	],

	turma: {
		id: 1,
		nome: 'foobar',
		status: 'Em Aberto',
		local: 'SP',
		whatsapp: '123123',
		disc: 'www.foobar.com',
		inCompany: false,
		pagseguroID: 0,
		modulo1: new Date('2020-01-10T17:30:00.000Z'),
		modulo2: new Date('2020-02-10T17:30:00.000Z'),
		modulo3: new Date('2020-03-10T17:30:00.000Z'),
		createdAt: '2020-01-01T17:30:00.000Z',
		updatedAt: '2020-01-01T17:30:00.000Z',
	},

	notification: {
		id: 1,
		notification_type: 1,
		aluno_id: 1,
		indicado_id: null,
		turma_id: 1,
		sent_at: null,
		sent_at_chatbot: null,
		check_answered: null,
		error: null,
		createdAt: '2020-03-06T19:11:34.622Z',
		updatedAt: '2020-03-06T19:11:34.622Z',
	},


};
