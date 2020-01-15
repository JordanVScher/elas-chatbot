module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.addColumn('turma', 'whatsapp', { type: Sequelize.STRING, allowNull: true }), // eslint-disable-line no-unused-vars
	down: (queryInterface, Sequelize) => queryInterface.removeColumn('turma', 'whatsapp'), // eslint-disable-line no-unused-vars
};
