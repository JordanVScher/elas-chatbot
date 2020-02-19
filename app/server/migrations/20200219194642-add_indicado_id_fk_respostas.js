
module.exports = {
  up: (queryInterface, Sequelize) => { // eslint-disable-line
		return queryInterface.addConstraint('respostas', ['id_indicado'], {
			type: 'foreign key',
			name: 'indicado_id_fk',
			references: {
				table: 'indicacao_avaliadores',
				field: 'id',
				onDelete: 'cascade',
				onUpdate: 'cascade',
			},
		});
	},

  down: (queryInterface, Sequelize) => { // eslint-disable-line
		return queryInterface.removeConstraint('respostas', 'indicado_id_fk');
	},
};
