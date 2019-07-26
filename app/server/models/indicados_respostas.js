module.exports = (sequelize, DataTypes) => {
	const indicadosRespostas = sequelize.define(
		'indicados_respostas', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			indicado_id: {
				type: DataTypes.INTEGER,
				references: {
					model: 'indicacao_avaliadores',
					key: 'id',
				},
				onUpdate: 'cascade',
				onDelete: 'cascade',
			},
			pre: DataTypes.JSON,
			pos: DataTypes.JSON,
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		},
	);

	indicadosRespostas.associate = (models) => {
		indicadosRespostas.belongsTo(models.indicacao_avaliadores, { foreignKey: 'indicado_id' });
	};
	return indicadosRespostas;
};
