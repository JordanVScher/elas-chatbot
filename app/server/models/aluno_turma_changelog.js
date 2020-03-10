module.exports = (sequelize, DataTypes) => {
	const turmaChange = sequelize.define(
		'aluno_turma_changelog', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			alunoID: { type: DataTypes.INTEGER, field: 'aluno_id' },
			turmaOriginal: { type: DataTypes.INTEGER, field: 'turma_original_id' },
			turmaNova: { type: DataTypes.INTEGER, field: 'turma_nova_id' },
			moduloOriginal: { type: DataTypes.INTEGER, field: 'modulo_original' },
			moduloNovo: { type: DataTypes.INTEGER, field: 'modulo_novo' },
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		},
	);

	return turmaChange;
};
