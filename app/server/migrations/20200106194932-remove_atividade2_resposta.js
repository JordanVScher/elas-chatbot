module.exports = {
	up: (queryInterface) => queryInterface.removeColumn('alunos_respostas', 'atividade_2'),
	down: (queryInterface, Sequelize) => queryInterface.addColumn('alunos_respostas', 'atividade_2', { type: Sequelize.BOOLEAN, allowNull: true }),
};
