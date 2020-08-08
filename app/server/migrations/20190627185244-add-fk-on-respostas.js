

module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.addConstraint('alunos_respostas', ['aluno_id'], { // eslint-disable-line no-unused-vars
		type: 'foreign key',
		name: 'aluno_id_fk',
		references: {
			table: 'alunos',
			field: 'id',
			onDelete: 'cascade',
			onUpdate: 'cascade',
		},
	}),

	down: (queryInterface, Sequelize) => queryInterface.removeConstraint('alunos_respostas', 'aluno_id_fk'), // eslint-disable-line no-unused-vars
};
