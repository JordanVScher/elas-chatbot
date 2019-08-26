module.exports = (sequelize, DataTypes) => {
	const model = sequelize.define(
		'notification_queue', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			notification_type: DataTypes.INTEGER,
			aluno_id: DataTypes.INTEGER,
			indicado_id: DataTypes.INTEGER,
			turma_id: DataTypes.INTEGER,
			when_to_send: DataTypes.DATE,
			check_answered: DataTypes.BOOLEAN,
			sent_at: DataTypes.DATE,
			error: DataTypes.JSON,
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		} // eslint-disable-line comma-dangle
	);
	return model;
};
