module.exports = (sequelize, DataTypes) => {
	const model = sequelize.define(
		'indicacao_avaliadores', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			aluno_id: DataTypes.INTEGER,
			nome: DataTypes.STRING,
			email: DataTypes.STRING,
			telefone: DataTypes.STRING,
			familiar: DataTypes.BOOLEAN,
			relacao_com_aluna: DataTypes.STRING,
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		} // eslint-disable-line comma-dangle
	);
	return model;
};
