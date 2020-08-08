module.exports = {
	up: (queryInterface) => queryInterface.bulkUpdate('questionario', { parameters: '{ "pgid": "PSIDRESPOSTA", "turma": "TURMARESPOSTA", "cpf": "CPFRESPOSTA" }' }, { name: 'atividade1' }),
	down: (queryInterface) => queryInterface.bulkUpdate('questionario', { parameters: '{ "pgid": "PSIDRESPOSTA", "turma": "TURMARESPOSTA" }' }, { name: 'atividade1' }),
};
