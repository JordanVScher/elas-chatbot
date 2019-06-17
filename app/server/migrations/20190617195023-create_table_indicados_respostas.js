
module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('indicados_respostas', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			indicado_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				unique: true,
			},
			pre: {
				type: Sequelize.JSON,
				allowNull: true,
			},
			pos: {
				type: Sequelize.JSON,
				allowNull: true,
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
		return queryInterface.dropTable('indicados_respostas');
	},
};
