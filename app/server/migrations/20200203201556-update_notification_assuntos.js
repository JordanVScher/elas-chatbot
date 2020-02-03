module.exports = {


	up: (queryInterface) => {
		queryInterface.bulkUpdate('notification_types', { email_subject: 'PROGRAMA ELAS - TURMA [TURMA] - INFORMAÇÕES IMPORTANTES: LOCAL E HORÁRIO DO TREINAMENTO' }, { id: 1 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'PROGRAMA ELAS - TURMA [TURMA] - Atividades 1 e 2 Pré Treinamento' }, { id: 2 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'PROGRAMA ELAS - VOCÊ FOI CONVIDADO PARA AVALIAR A *|NOMEUM|*' }, { id: 3 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'PROGRAMA ELAS - AVALIAÇÃO 360°' }, { id: 4 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'PROGRAMA ELAS - COMO FOI O MÓDULO 1 PARA VOCÊ?' }, { id: 5 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'PROGRAMA ELAS - LEITURA PRÉVIA - MÓDULO 2' }, { id: 6 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'PROGRAMA ELAS - COMO FOI O MÓDULO 2 PARA VOCÊ?' }, { id: 7 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'PROGRAMA ELAS - ATIVIDADES PRÉ FINALIZAÇÃO DO CURSO' }, { id: 8 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'PROGRAMA ELAS - VOCÊ ESTÁ SENDO CONVIDADO PARA REAVALIAR A *|NOMEUM|*!' }, { id: 9 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'PROGRAMA ELAS - AVALIAÇÃO 360° PÓS' }, { id: 10 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'PROGRAMA ELAS - APRESENTAÇÃO FINAL DE CURSO - MÓDULO 3' }, { id: 11 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'PROGRAMA ELAS - Homenagem especial feita por você para *|NOMEUM|*' }, { id: 12 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'PROGRAMA ELAS - COMO FOI O PROGRAMA ELAS PARA VOCÊ?' }, { id: 13 });
		queryInterface.bulkUpdate('notification_types', { email_subject: '[ LEMBRETE ] - Programa ELAS - Um dia antes' }, { id: 14 });
		return queryInterface.bulkUpdate('notification_types', { email_subject: '[ LEMBRETE ] - Programa ELAS - Uma hora antes' }, { id: 15 });
	},

	down: (queryInterface) => {
		queryInterface.bulkUpdate('notification_types', { email_subject: 'Informações importantes sobre seu curso - Programa ELAS' }, { id: 1 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'Atividades Pré-Treinamento - PROGRAMA ELAS' }, { id: 2 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'Você foi convidado(a) para avaliar a [NOMEUM]' }, { id: 3 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'Lembre seus avaliadores - Programa ELAS' }, { id: 4 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'Como foi o módulo 1 para você? Conte para a gente! - Programa ELAS' }, { id: 5 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'Leitura Prévia Módulo 2 -  Programa ELAS' }, { id: 6 });
		queryInterface.bulkUpdate('notification_types', { email_subject: '[Atividades Prévias para o Último Módulo] - Programa ELAS' }, { id: 7 });
		queryInterface.bulkUpdate('notification_types', { email_subject: '[ VOCÊ ESTÁ SENDO CONVIDADO(A) PARA AVALIAR A [NOMEUM] NOVAMENTE! ]' }, { id: 8 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'Lembre seus avaliadores - Programa ELAS' }, { id: 9 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'Apresentação Final de Curso - Programa ELAS' }, { id: 10 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'Como foi o módulo 2 para você? Conte para a gente! - Programa ELAS' }, { id: 11 });
		queryInterface.bulkUpdate('notification_types', { email_subject: 'Homenagem especial feita por você para [NOMEUM]' }, { id: 12 });
		queryInterface.bulkUpdate('notification_types', { email_subject: '[ COMO FOI O PROGRAMA ELAS PARA VOCÊ? ] - Programa ELAS' }, { id: 13 });
		queryInterface.bulkUpdate('notification_types', { email_subject: '[ LEMBRETE ] - Programa ELAS' }, { id: 14 });
		return queryInterface.bulkUpdate('notification_types', { email_subject: '[ LEMBRETE ] - Programa ELAS' }, { id: 15 });
	},
};
