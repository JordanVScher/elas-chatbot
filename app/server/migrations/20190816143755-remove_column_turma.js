module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.removeColumn('alunos', 'turma'), // eslint-disable-line no-unused-vars

	down: (queryInterface, Sequelize) => queryInterface.addColumn('alunos', 'turma', {
		type: Sequelize.STRING,
	}),
};
