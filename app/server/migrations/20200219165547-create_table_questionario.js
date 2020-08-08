
module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('questionario', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			id_surveymonkey: {
				allowNull: false,
				unique: true,
				type: Sequelize.STRING,
			},
			name: {
				type: Sequelize.STRING,
			},
			link: {
				allowNull: false,
				type: Sequelize.STRING,
			},
			parameters: {
				type: Sequelize.JSON,
			},
			details: {
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
		return queryInterface.dropTable('questionario');
	},
};
