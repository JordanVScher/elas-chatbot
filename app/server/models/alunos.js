module.exports = (sequelize, DataTypes) => {
	const alunos = sequelize.define(
		'alunos', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			nome_completo: DataTypes.STRING,
			cpf: DataTypes.STRING,
			email: DataTypes.STRING,
			turma_id: DataTypes.STRING,
			rg: DataTypes.STRING,
			telefone: DataTypes.STRING,
			endereco: DataTypes.STRING,
			data_nascimento: DataTypes.STRING,
			contato_emergencia_nome: DataTypes.STRING,
			contato_emergencia_fone: DataTypes.STRING,
			contato_emergencia_email: DataTypes.STRING,
			contato_emergencia_relacao: DataTypes.STRING,
			added_by_admin: DataTypes.BOOLEAN,
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
