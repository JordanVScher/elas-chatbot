module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.addColumn('aluno_pesquisa', 'links_enviados', { type: Sequelize.JSON, allowNull: true }), // eslint-disable-line no-unused-vars
	down: (queryInterface, Sequelize) => queryInterface.removeColumn('aluno_pesquisa', 'links_enviados'), // eslint-disable-line no-unused-vars
};
