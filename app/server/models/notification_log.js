module.exports = (sequelize, DataTypes) => {
	const notificationLog = sequelize.define(
		'notification_log', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			notificationId: { type: DataTypes.INTEGER, field: 'notification_id' },
			notificationRules: { type: DataTypes.JSON, field: 'notification_rules' },
			recipientData: { type: DataTypes.JSON, field: 'recipient_data' },
			shouldSend: { type: DataTypes.BOOLEAN, field: 'should_send' },
			masks: DataTypes.JSON,
			sentEmail: { type: DataTypes.STRING, field: 'sent_email' },
			sentBroadcast: { type: DataTypes.STRING, field: 'sent_broadcast' },
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		},
	);


	return notificationLog;
};
