module.exports = (sequelize, DataTypes) => {
	const alunosRespostas = sequelize.define(
		'alunos_respostas', {
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
			pre: DataTypes.JSON,
			pos: DataTypes.JSON,
			atividade_indicacao: DataTypes.JSON,
			avaliacao_modulo1: DataTypes.JSON,
			avaliacao_modulo2: DataTypes.JSON,
			avaliacao_modulo3: DataTypes.JSON,
			atividade_1: DataTypes.JSON,
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		},
	);

	alunosRespostas.associate = (models) => {
		alunosRespostas.belongsTo(models.alunos, { foreignKey: 'aluno_id' });
	};
	return alunosRespostas;
};
