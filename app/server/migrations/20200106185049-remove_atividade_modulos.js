module.exports = {
	up: (queryInterface, Sequelize) => // eslint-disable-line no-unused-vars
		queryInterface.removeColumn('alunos_respostas', 'atividade_modulo1') // eslint-disable-line implicit-arrow-linebreak
			.then(queryInterface.removeColumn('alunos_respostas', 'atividade_modulo2'))
			.then(queryInterface.removeColumn('alunos_respostas', 'atividade_modulo3')),

	down: (queryInterface, Sequelize) => // eslint-disable-line no-unused-vars
		queryInterface.addColumn('alunos_respostas', 'atividade_modulo1', { type: Sequelize.BOOLEAN, allowNull: true }) // eslint-disable-line implicit-arrow-linebreak
			.then(queryInterface.addColumn('alunos_respostas', 'atividade_modulo2', { type: Sequelize.BOOLEAN, allowNull: true }))
			.then(queryInterface.addColumn('alunos_respostas', 'atividade_modulo3', { type: Sequelize.BOOLEAN, allowNull: true })),
};
