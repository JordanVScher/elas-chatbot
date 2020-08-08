module.exports = {
	up(queryInterface) {
		return queryInterface.removeColumn('alunos_respostas', 'atividade_avaliador');
	},
	down(queryInterface, Sequelize) {
		return queryInterface.addColumn(
			'alunos_respostas',
			'atividade_avaliador',
			{
				type: Sequelize.STRING,
				allowNull: true,
				defaultValue: false,
			},
		);
	},
};
