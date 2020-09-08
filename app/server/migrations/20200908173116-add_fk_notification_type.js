
module.exports = {
  up: (queryInterface, Sequelize) => { // eslint-disable-line
		return queryInterface.addConstraint('notification_rules', ['notification_type'], {
			type: 'foreign key',
			name: 'notification_type_fk',
			references: {
				table: 'notification_types',
				field: 'id',
				onDelete: 'cascade',
				onUpdate: 'cascade',
			},
		});
	},

  down: (queryInterface, Sequelize) => { // eslint-disable-line
		return queryInterface.removeConstraint('notification_rules', 'notification_type_fk');
	},
};
