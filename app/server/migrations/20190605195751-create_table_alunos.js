
module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('alunos', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			nome_completo: {
				type: Sequelize.STRING,
			},
			cpf: {
				type: Sequelize.STRING,
				unique: true,
			},
			email: {
				type: Sequelize.STRING,
			},
			turma: {
				type: Sequelize.STRING,
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
		return queryInterface.dropTable('alunos');
	},
};
