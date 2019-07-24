module.exports = (sequelize, DataTypes) => {
	const nQueue = sequelize.define(
		'notification_queue', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			notification_type: DataTypes.INTEGER,
			aluno_id: DataTypes.INTEGER,
			indicacao_avaliadores: DataTypes.INTEGER,
			when_to_send: DataTypes.DATE,
			sent_at: DataTypes.DATE,
			error: DataTypes.JSON,
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		} // eslint-disable-line comma-dangle
	);
	return nQueue;
};
