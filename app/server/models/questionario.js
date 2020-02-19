module.exports = (sequelize, DataTypes) => {
	const questionario = sequelize.define(
		'questionario', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			idSM: { type: DataTypes.STRING, field: 'id_surveymonkey' },
			name: DataTypes.STRING,
			link: DataTypes.STRING,
			parameters: DataTypes.JSON,
			details: DataTypes.JSON,
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		},
	);

	return questionario;
};
