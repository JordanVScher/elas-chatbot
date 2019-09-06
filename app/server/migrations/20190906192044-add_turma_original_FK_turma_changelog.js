
module.exports = {
  up: (queryInterface, Sequelize) => { // eslint-disable-line
		return queryInterface.addConstraint('aluno_turma_changelog', ['turma_original_id'], {
			type: 'foreign key',
			name: 'turma_original_id_fk',
			references: {
				table: 'turma',
				field: 'id',
				onDelete: 'cascade',
				onUpdate: 'cascade',
			},
		});
	},

  down: (queryInterface, Sequelize) => { // eslint-disable-line
		return queryInterface.removeConstraint('aluno_turma_changelog', 'turma_original_id_fk');
	},
};
