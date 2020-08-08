module.exports = {
	up: (queryInterface, Sequelize) =>
		queryInterface.removeColumn('alunos_respostas', 'atividade_1') // eslint-disable-line implicit-arrow-linebreak
			.then(queryInterface.addColumn('alunos_respostas', 'atividade_1', { type: Sequelize.JSON, allowNull: true })),

	down: (queryInterface, Sequelize) => // eslint-disable-line no-unused-vars
		queryInterface.removeColumn('alunos_respostas', 'atividade_1') // eslint-disable-line implicit-arrow-linebreak
			.then(queryInterface.addColumn('alunos_respostas', 'atividade_1', { type: Sequelize.BOOLEAN, allowNull: true })),
};
