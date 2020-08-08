module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.addColumn('alunos', 'added_by_admin', { type: Sequelize.BOOLEAN, allowNull: true }), // eslint-disable-line no-unused-vars
	down: (queryInterface, Sequelize) => queryInterface.removeColumn('alunos', 'added_by_admin'), // eslint-disable-line no-unused-vars
};
