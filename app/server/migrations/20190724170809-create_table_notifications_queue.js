module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('notification_queue', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			notification_type: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: 'notification_types',
					key: 'id',
				},
				onUpdate: 'cascade',
				onDelete: 'cascade',
			},
			aluno_id: {
				type: Sequelize.INTEGER,
				allowNull: true,
				references: {
					model: 'alunos',
					key: 'id',
				},
				onUpdate: 'cascade',
				onDelete: 'cascade',
			},
			indicacao_avaliadores: {
				allowNull: true,
				type: Sequelize.INTEGER,
				references: {
					model: 'notification_types',
					key: 'id',
				},
				onUpdate: 'cascade',
				onDelete: 'cascade',
			},
			when_to_send: {
				allowNull: false,
				type: Sequelize.DATE,
			},
			sent_at: {
				allowNull: true,
				type: Sequelize.DATE,
			},
			error: {
				allowNull: true,
				type: Sequelize.JSON,
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
		return queryInterface.dropTable('notification_queue');
	},
};
