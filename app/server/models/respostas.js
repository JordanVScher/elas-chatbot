module.exports = (sequelize, DataTypes) => {
	const respostas = sequelize.define(
		'respostas', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			id_surveymonkey: DataTypes.STRING,
			id_questionario: DataTypes.INTEGER,
			id_aluno: DataTypes.INTEGER,
			id_indicado: DataTypes.INTEGER,
			URL: DataTypes.STRING,
			answer: DataTypes.JSON,
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		},
	);

	return respostas;
};
