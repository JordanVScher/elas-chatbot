module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.addColumn('alunos', 'veio_do_admin', { type: Sequelize.BOOLEAN, default: false, allowNull: true }), // eslint-disable-line no-unused-vars
	down: (queryInterface, Sequelize) => queryInterface.removeColumn('alunos', 'veio_do_admin'), // eslint-disable-line no-unused-vars
};
