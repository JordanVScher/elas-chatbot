module.exports = (sequelize, DataTypes) => {
	const model = sequelize.define(
		'notification_types', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			email_subject: DataTypes.STRING,
			email_text: DataTypes.STRING,
			chatbot_text: DataTypes.STRING,
			chatbot_quick_reply: DataTypes.STRING,
			chatbot_cards: DataTypes.STRING,
			attachment_name: DataTypes.STRING,
			attachment_link: DataTypes.STRING,
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		} // eslint-disable-line comma-dangle
	);
	return model;
};
