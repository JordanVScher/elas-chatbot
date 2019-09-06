
module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('aluno_turma_changelog', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			aluno_id: {
				type: Sequelize.INTEGER,
			},
			turma_original_id: {
				type: Sequelize.INTEGER,
			},
			turma_nova_id: {
				type: Sequelize.INTEGER,
			},
			turma_modulo: {
				type: Sequelize.INTEGER,
			},
			created_at: {
				allowNull: false,
				type: Sequelize.DATE,
			},
			updated_at: {
				allowNull: false,
				type: Sequelize.DATE,
			},
		});
	},
	down(queryInterface) {
		return queryInterface.dropTable('aluno_turma_changelog');
	},
};
