module.exports = (sequelize, DataTypes) => {
	const model = sequelize.define(
		'notification_rules', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			notification_type: { type: DataTypes.INTEGER, allowNull: false },
			modulo: { type: DataTypes.INTEGER, allowNull: false },
			days: { type: DataTypes.INTEGER, allowNull: false, field: 'dias' },
			hours: { type: DataTypes.INTEGER, allowNull: false, field: 'horas' },
			reminderDate: { type: DataTypes.INTEGER, allowNull: false, field: 'reenvio_dias' },
			indicado: { type: DataTypes.BOOLEAN, allowNull: false, field: 'indicado' },
			familiar: { type: DataTypes.BOOLEAN, allowNull: false, field: 'familiar' },
			sunday: { type: DataTypes.BOOLEAN, allowNull: false, field: 'domingo' },
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		} // eslint-disable-line comma-dangle
	);
	return model;
};
