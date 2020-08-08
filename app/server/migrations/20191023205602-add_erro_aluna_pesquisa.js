module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.addColumn('aluno_pesquisa', 'error', { type: Sequelize.JSON, allowNull: true }), // eslint-disable-line no-unused-vars
	down: (queryInterface, Sequelize) => queryInterface.removeColumn('aluno_pesquisa', 'error'), // eslint-disable-line no-unused-vars
};
