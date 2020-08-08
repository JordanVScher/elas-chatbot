module.exports = {
	up: (queryInterface, Sequelize) =>
		queryInterface.addColumn('alunos_respostas', 'avaliacao_modulo1', { type: Sequelize.JSON, allowNull: true }) // eslint-disable-line implicit-arrow-linebreak
			.then(queryInterface.addColumn('alunos_respostas', 'avaliacao_modulo2', { type: Sequelize.JSON, allowNull: true }))
			.then(queryInterface.addColumn('alunos_respostas', 'avaliacao_modulo3', { type: Sequelize.JSON, allowNull: true })),

	down: (queryInterface, Sequelize) => // eslint-disable-line no-unused-vars
		queryInterface.removeColumn('alunos_respostas', 'avaliacao_modulo1') // eslint-disable-line implicit-arrow-linebreak
			.then(queryInterface.removeColumn('alunos_respostas', 'avaliacao_modulo2'))
			.then(queryInterface.removeColumn('alunos_respostas', 'avaliacao_modulo3')),
};
