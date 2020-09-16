module.exports = {
	up: (queryInterface, Sequelize) => {
		queryInterface.addColumn('notification_rules', 'is_active', { type: Sequelize.BOOLEAN, allowNull: true });
		queryInterface.bulkUpdate('notification_rules', { is_active: false }, { id: { [Sequelize.Op.gte]: 1 } }, {});
		return queryInterface.changeColumn('notification_rules', 'is_active', { type: Sequelize.BOOLEAN, allowNull: false });
	},

	down: (queryInterface) => queryInterface.removeColumn('notification_rules', 'is_active'),
};
