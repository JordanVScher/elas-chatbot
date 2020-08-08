
module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('questionario_sync', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			id_questionario: {
				unique: true,
				type: Sequelize.INTEGER,
			},
			last_verified: {
				type: Sequelize.DATE,
			},
			next_verification: {
				type: Sequelize.DATE,
			},
			current_page: {
				type: Sequelize.INTEGER,
			},
			error_msg: {
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
		return queryInterface.dropTable('questionario_sync');
	},
};
