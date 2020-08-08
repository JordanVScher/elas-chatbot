
module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('chatbot_users', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			fb_id: {
				type: Sequelize.BIGINT,
				allowNull: false,
				unique: true,
			},
			user_name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			cpf: {
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
		return queryInterface.dropTable('chatbot_users');
	},
};
