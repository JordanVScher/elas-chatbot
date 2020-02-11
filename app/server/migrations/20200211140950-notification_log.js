module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('notification_log', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			notification_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			notification_rules: {
				type: Sequelize.JSON,
				allowNull: true,
			},
			recipient_data: {
				type: Sequelize.JSON,
				allowNull: true,
			},
			should_send: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			masks: {
				type: Sequelize.JSON,
				allowNull: true,
			},
			sent_email: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			sent_broadcast: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});
	},
	down(queryInterface) {
		return queryInterface.dropTable('notification_log');
	},
};
