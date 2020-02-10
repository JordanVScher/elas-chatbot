module.exports = (sequelize, DataTypes) => {
	const matriculaLog = sequelize.define(
		'matricula_mail_log', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			sentTo: { type: DataTypes.STRING, field: 'sent_to' },
			sentAt: { type: DataTypes.DATE, field: 'sent_at' },
			error: DataTypes.JSON,
			pos: DataTypes.JSON,
			atividadeLink: { type: DataTypes.STRING, field: 'atividade_link' },
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		},
	);


	return matriculaLog;
};
