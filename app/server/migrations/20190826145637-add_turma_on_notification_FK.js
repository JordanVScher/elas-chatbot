module.exports = {
	up(queryInterface, Sequelize) {
		queryInterface.addColumn('notification_queue', 'turma_id', {
			type: Sequelize.INTEGER,
		});

		return queryInterface.addConstraint('notification_queue', ['turma_id'], {
			type: 'foreign key',
			name: 'turma_id_fk',
			references: {
				table: 'turma',
				field: 'id',
				onDelete: 'cascade',
				onUpdate: 'cascade',
			},
		});
	},

	down: (queryInterface, Sequelize) => queryInterface.removeColumn('notification_queue', 'turma_id'), // eslint-disable-line no-unused-vars
};
