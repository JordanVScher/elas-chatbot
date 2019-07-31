module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.addColumn('notification_queue', 'check_answered', Sequelize.BOOLEAN, {
			allowNull: true,
		});
	},

	down: (queryInterface, Sequelize) => queryInterface.removeColumn('notification_queue', 'check_answered', Sequelize.BOOLEAN, {}),
};
