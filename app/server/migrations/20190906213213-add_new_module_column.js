module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.addColumn('aluno_turma_changelog', 'modulo_novo', { type: Sequelize.INTEGER }), // eslint-disable-line no-unused-vars
	down: (queryInterface, Sequelize) => queryInterface.removeColumn('aluno_turma_changelog', 'modulo_novo'), // eslint-disable-line no-unused-vars
};
