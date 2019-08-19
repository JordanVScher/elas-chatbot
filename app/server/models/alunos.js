module.exports = (sequelize, DataTypes) => {
	const alunos = sequelize.define(
		'alunos', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			nome_completo: DataTypes.STRING,
			cpf: DataTypes.STRING,
			email: DataTypes.STRING,
			turma_id: DataTypes.STRING,
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		},
	);

	alunos.associate = (models) => {
		// alunos.hasMany(models.indicacao_avaliadores, { as: 'indicados', foreignKey: 'aluno_id' });
		alunos.hasOne(models.chatbot_users, { as: 'chatbot', foreignKey: 'cpf', sourceKey: 'cpf' });
	};
	return alunos;
};
