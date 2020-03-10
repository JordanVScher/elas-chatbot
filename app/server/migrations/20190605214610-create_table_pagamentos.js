
module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('pagamentos', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			email: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			documento_tipo: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			documento_valor: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			id_produto: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			id_transacao: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
			},
			created_at: {
				allowNull: false,
				type: Sequelize.DATE,
			},
			updated_at: {
				allowNull: false,
				type: Sequelize.DATE,
			},
		});
	},
	down(queryInterface) {
		return queryInterface.dropTable('pagamentos');
	},
};
