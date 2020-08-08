module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.addColumn('turma', 'disc', { type: Sequelize.STRING, allowNull: true }),
	down: (queryInterface) => queryInterface.removeColumn('turma', 'disc'),
};
