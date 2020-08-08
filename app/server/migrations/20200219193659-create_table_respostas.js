module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('respostas', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			id_surveymonkey: {
				unique: true,
				allowNull: false,
				type: Sequelize.STRING,
			},
			id_questionario: {
				allowNull: false,
				type: Sequelize.INTEGER,
			},
			URL: {
				allowNull: false,
				type: Sequelize.STRING,
			},
			id_aluno: {
				allowNull: true,
				type: Sequelize.INTEGER,
			},
			id_indicado: {
				allowNull: true,
				type: Sequelize.INTEGER,
			},
			answer: {
				type: Sequelize.JSON,
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
		return queryInterface.dropTable('respostas');
	},
};
