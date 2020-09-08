module.exports = (sequelize, DataTypes) => {
	const mail1 = sequelize.define(
		'mail_atividade1', {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
			assunto: { type: DataTypes.STRING },
			texto1: { type: DataTypes.STRING },
			texto2: { type: DataTypes.STRING },
			texto3: { type: DataTypes.STRING },
			texto4: { type: DataTypes.STRING },
			inCompany: { type: DataTypes.BOOLEAN, field: 'in_company' },
			createdAt: { type: DataTypes.DATE, field: 'created_at' },
			updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
		},
		{
			freezeTableName: true,
		},
	);

	return mail1;
};
