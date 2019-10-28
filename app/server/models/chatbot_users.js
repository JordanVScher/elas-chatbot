module.exports = (sequelize, DataTypes) => {
	const chatbot = sequelize.define(
		'chatbot_users', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			fb_id: DataTypes.BIGINT,
			user_name: DataTypes.STRING,
			cpf: DataTypes.STRING,
			is_admin: DataTypes.BOOLEAN,
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		},
	);

	return chatbot;
};
