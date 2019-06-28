

module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.addColumn('pagamentos', 'aluno_id', {
		type: Sequelize.INTEGER,
		references: {
			model: 'alunos',
			key: 'id',
		},
	}),

	down: (queryInterface, Sequelize) => queryInterface.removeColumn('pagamentos', 'aluno_id'),
};
