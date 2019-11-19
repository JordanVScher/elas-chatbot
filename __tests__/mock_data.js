module.exports = {
	alunaNotificationBefore: {
		id: 1,
		notification_type: 1,
		aluno_id: 120,
		turma_id: 1,
		sent_at: null,
		error: null,
	},

	alunaNotificationAfter: {
		id: 1,
		notification_type: 5,
		aluno_id: 120,
		turma_id: 1,
		sent_at: null,
		error: null,
	},

	alunaNotificationAfterMod3: {
		id: 1,
		notification_type: 14,
		aluno_id: 120,
		turma_id: 1,
		sent_at: null,
		error: null,
	},

	indicadoNotification: {
		id: 1,
		notification_type: 3,
		aluno_id: 120,
		indicado_id: 15,
		turma_id: 1,
		sent_at: null,
		error: null,
	},

	type15notification: {
		id: 1,
		notification_type: 15,
		aluno_id: 120,
		turma_id: 1,
		sent_at: null,
		error: null,
	},

	type16notification: {
		id: 1,
		notification_type: 16,
		aluno_id: 120,
		turma_id: 1,
		sent_at: null,
		error: null,
	},

	moduleDates: [{
		id: 1,
		local: 'FOOBAR',
		modulo1: '2019-01-05T10:00:00.000Z',
		modulo2: '2019-03-05T12:30:00.000Z',
		modulo3: '2019-05-05T18:50:00.000Z',
	}, {
		id: 2,
		local: 'Foo',
		modulo1: '2018-12-07T16:14:00.000Z',
		modulo2: '2019-01-18T18:43:00.000Z',
		modulo3: '2019-02-08T17:25:00.000Z',
	}],

	baseRecipientIndicado: {
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
		{ notification_type: 1, modulo: 1, timeChange: [{ qtd: -19, type: 'days' }] },
		{ notification_type: 2, modulo: 1, timeChange: [{ qtd: -19, type: 'days' }] },
		{ notification_type: 3, modulo: 1, timeChange: [{ qtd: -10, type: 'days' }], indicado: true, reminderDate: 6 }, // eslint-disable-line object-curly-newline
		{ notification_type: 4, modulo: 1, timeChange: [{ qtd: -10, type: 'days' }] },
		{ notification_type: 5, modulo: 1, timeChange: [{ qtd: 1, type: 'days' }, { qtd: 20, type: 'hours' }] }, // 20 hours after the second day of class
		{ notification_type: 6, modulo: 2, timeChange: [{ qtd: -12, type: 'days' }] },
		{ notification_type: 7, modulo: 2, timeChange: [{ qtd: 1, type: 'days' }] }, // on the second class
		{ notification_type: 8, modulo: 2, timeChange: [{ qtd: 1, type: 'days' }, { qtd: 20, type: 'hours' }] }, // 20 hours after the second day of class
		{ notification_type: 9, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }] },
		{ notification_type: 10, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }], indicado: true, reminderDate: 3 }, // eslint-disable-line object-curly-newline
		{ notification_type: 11, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }] },
		{ notification_type: 12, modulo: 3, timeChange: [{ qtd: -7, type: 'days' }], indicado: true, familiar: true }, // eslint-disable-line object-curly-newline
		{ notification_type: 13, modulo: 3, timeChange: [{ qtd: 1, type: 'days' }, { qtd: 20, type: 'hours' }] }, // 20 hours after the second day of class
		{ notification_type: 14, modulo: 3, timeChange: [{ qtd: 5, type: 'days' }] },
		// Receive notification 24h before every class
		{ notification_type: 15, modulo: 1, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -24, type: 'hours' }] },
		{ notification_type: 15, modulo: 2, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -24, type: 'hours' }] },
		{ notification_type: 15, modulo: 3, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -24, type: 'hours' }] },
		// Receive notification 1h before every class, on saturday (-1h) and sunday (saturday + 23h)
		{ notification_type: 16, modulo: 1, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -1, type: 'hours' }], sunday: false }, // eslint-disable-line object-curly-newline
		{ notification_type: 16, modulo: 2, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -1, type: 'hours' }], sunday: false }, // eslint-disable-line object-curly-newline
		{ notification_type: 16, modulo: 3, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -1, type: 'hours' }], sunday: false }, // eslint-disable-line object-curly-newline
		{ notification_type: 16, modulo: 1, timeChange: [{ qtd: 0, type: 'days' }, { qtd: 23, type: 'hours' }], sunday: true }, // eslint-disable-line object-curly-newline
		{ notification_type: 16, modulo: 2, timeChange: [{ qtd: 0, type: 'days' }, { qtd: 23, type: 'hours' }], sunday: true }, // eslint-disable-line object-curly-newline
		{ notification_type: 16, modulo: 3, timeChange: [{ qtd: 0, type: 'days' }, { qtd: 23, type: 'hours' }], sunday: true }, // eslint-disable-line object-curly-newline
	],
};
