

module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.addConstraint('indicacao_avaliadores', ['aluno_id'], {
		type: 'foreign key',
		name: 'aluno_id_fk',
		references: {
			table: 'alunos',
			field: 'id',
			onDelete: 'cascade',
			onUpdate: 'cascade',
		},
	}),

	down: (queryInterface, Sequelize) => queryInterface.removeConstraint('indicacao_avaliadores', 'aluno_id_fk'),
};
