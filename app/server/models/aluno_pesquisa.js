module.exports = (sequelize, DataTypes) => {
	const pesquisa = sequelize.define(
		'aluno_pesquisa', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			alunoID: { type: DataTypes.INTEGER, field: 'aluno_id' },
			dataInicial: { type: DataTypes.DATE, field: 'data_inicial' },
			msgsEnviadas: { type: DataTypes.INTEGER, field: 'msgs_enviadas' },
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
			error: { type: DataTypes.JSON, field: 'error' },
		},
		{
			freezeTableName: true,
		},
	);

	return pesquisa;
};
