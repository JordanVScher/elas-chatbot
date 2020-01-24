module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.addColumn('turma', 'whatsapp', { type: Sequelize.STRING, allowNull: true }),
	down: (queryInterface) => queryInterface.removeColumn('turma', 'whatsapp'),
};
