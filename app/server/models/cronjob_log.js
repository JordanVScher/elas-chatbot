module.exports = (sequelize, DataTypes) => {
	const cronjobjob = sequelize.define(
		'cronjob_log', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			name: DataTypes.STRING,
			runAt: { type: DataTypes.DATE, field: 'run_at' },
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		},
	);

	return cronjobjob;
};
