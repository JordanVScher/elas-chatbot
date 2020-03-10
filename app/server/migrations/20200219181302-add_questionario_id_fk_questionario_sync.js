
module.exports = {
  up: (queryInterface, Sequelize) => { // eslint-disable-line
		return queryInterface.addConstraint('questionario_sync', ['id_questionario'], {
			type: 'foreign key',
			name: 'questionario_id_fk',
			references: {
				table: 'questionario',
				field: 'id',
				onDelete: 'cascade',
				onUpdate: 'cascade',
			},
		});
	},

  down: (queryInterface, Sequelize) => { // eslint-disable-line
		return queryInterface.removeConstraint('questionario_sync', 'questionario_id_fk');
	},
};
