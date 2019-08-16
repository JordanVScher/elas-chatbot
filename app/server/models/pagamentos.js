module.exports = (sequelize, DataTypes) => {
	const pagamentos = sequelize.define(
		'pagamentos', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			email: DataTypes.STRING,
			produtoID: { type: DataTypes.INTEGER, field: 'id_produto' },
			transacaoID: { type: DataTypes.STRING, field: 'id_transacao' },
			alunoID: { type: DataTypes.INTEGER, field: 'aluno_id' },
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		},
	);

	return pagamentos;
};
