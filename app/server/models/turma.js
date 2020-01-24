module.exports = (sequelize, DataTypes) => {
	const turma = sequelize.define(
		'turma', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			nome: DataTypes.STRING,
			status: DataTypes.STRING,
			local: DataTypes.STRING,
			whatsapp: DataTypes.STRING,
			disc: DataTypes.STRING,
			inCompany: { type: DataTypes.BOOLEAN, field: 'in_company' },
			pagseguroID: { type: DataTypes.INTEGER, field: 'pagseguro_id' },
			modulo1: { type: DataTypes.DATE, field: 'horario_modulo1' },
			modulo2: { type: DataTypes.DATE, field: 'horario_modulo2' },
			modulo3: { type: DataTypes.DATE, field: 'horario_modulo3' },
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		},
	);


	return turma;
};
