
module.exports = {
  up: (queryInterface, Sequelize) => { // eslint-disable-line
		return queryInterface.addConstraint('aluno_pesquisa', ['aluno_id'], {
			type: 'foreign key',
			name: 'aluno_id_fk',
			references: {
				table: 'alunos',
				field: 'id',
				onDelete: 'cascade',
				onUpdate: 'cascade',
			},
		});
	},

  down: (queryInterface, Sequelize) => { // eslint-disable-line
		return queryInterface.removeConstraint('aluno_pesquisa', 'aluno_id_fk');
	},
};
