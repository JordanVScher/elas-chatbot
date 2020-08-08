module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('notification_types', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
			},
			email_subject: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			email_text: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			chatbot_text: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			chatbot_quick_reply: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			chatbot_cards: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			attachment_name: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			attachment_link: {
				type: Sequelize.TEXT,
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
	down(queryInterface) {
		return queryInterface.dropTable('notification_types');
	},
};
