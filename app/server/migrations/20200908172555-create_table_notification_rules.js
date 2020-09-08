module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('notification_rules', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			notification_type: {
				allowNull: false,
				type: Sequelize.INTEGER,
			},
			modulo: {
				allowNull: false,
				type: Sequelize.INTEGER,
			},
			dias: {
				allowNull: true,
				type: Sequelize.INTEGER,
				default: 0,
			},
			horas: {
				allowNull: true,
				type: Sequelize.INTEGER,
				default: 0,
			},
			reenvio_dias: {
				allowNull: true,
				type: Sequelize.INTEGER,
			},
			indicado: {
				allowNull: true,
				type: Sequelize.BOOLEAN,
				default: false,
			},
			familiar: {
				allowNull: true,
				type: Sequelize.BOOLEAN,
				default: false,
			},
			domingo: {
				allowNull: true,
				type: Sequelize.BOOLEAN,
				default: false,
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
		return queryInterface.dropTable('notification_rules');
	},
};
