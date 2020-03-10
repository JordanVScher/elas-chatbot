
module.exports = {
	up(queryInterface) {
		return queryInterface.dropTable('indicacao_familiares');
	},
	down(queryInterface, Sequelize) {
		return queryInterface.createTable('indicacao_familiares', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			aluno_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			nome: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			relacao_com_aluna: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			email: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			telefone: {
				type: Sequelize.STRING,
				allowNull: true,
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
};
