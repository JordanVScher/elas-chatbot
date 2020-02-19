module.exports = (sequelize, DataTypes) => {
	const questionarioSync = sequelize.define(
		'questionario_sync', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			id_questionario: DataTypes.INTEGER,
			last_verified: DataTypes.DATE,
			next_verification: DataTypes.DATE,
			current_page: DataTypes.INTEGER,
			error_msg: DataTypes.JSON,
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		},
	);

	return questionarioSync;
};
