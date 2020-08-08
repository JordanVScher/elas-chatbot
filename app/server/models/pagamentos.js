module.exports = (sequelize, DataTypes) => {
	const pagamentos = sequelize.define(
		'pagamentos', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			email: DataTypes.STRING,
			productID: { type: DataTypes.INTEGER, field: 'id_produto' },
			docType: { type: DataTypes.INTEGER, field: 'documento_tipo' },
			docValue: { type: DataTypes.INTEGER, field: 'documento_valor' },
			transactionID: { type: DataTypes.STRING, field: 'id_transacao' },
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
