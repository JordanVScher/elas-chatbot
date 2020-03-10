module.exports = (sequelize, DataTypes) => {
	const eventLog = sequelize.define(
		'sm_answer_event_log', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			sm_event_id: DataTypes.STRING,
			sm_survey_id: DataTypes.STRING,
			answer_sm_id: DataTypes.STRING,
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		},
	);


	return eventLog;
};
