module.exports = {
	up(queryInterface, Sequelize) {
		queryInterface.addColumn('alunos', 'turma_id', {
			type: Sequelize.INTEGER,
		});

		return queryInterface.addConstraint('alunos', ['turma_id'], {
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

	down: (queryInterface, Sequelize) => queryInterface.removeColumn('alunos', 'turma'), // eslint-disable-line no-unused-vars
};
