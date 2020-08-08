
module.exports = {
  up: (queryInterface, Sequelize) => { // eslint-disable-line
		return queryInterface.addConstraint('respostas', ['id_aluno'], {
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
		return queryInterface.removeConstraint('respostas', 'aluno_id_fk');
	},
};
