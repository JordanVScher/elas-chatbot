module.exports = (sequelize, DataTypes) => {
	const indicacaoAvaliadores = sequelize.define(
		'indicacao_avaliadores', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			aluno_id: {
				type: DataTypes.INTEGER,
				references: {
					model: 'alunos',
					key: 'id',
				},
				onUpdate: 'cascade',
				onDelete: 'cascade',
			},
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
		},
	);

	indicacaoAvaliadores.associate = (models) => {
		indicacaoAvaliadores.hasOne(models.indicados_respostas, { as: 'respostas', foreignKey: 'indicado_id' });
		indicacaoAvaliadores.belongsTo(models.alunos, { as: 'aluna', foreignKey: 'aluno_id' });
	};
	return indicacaoAvaliadores;
};
