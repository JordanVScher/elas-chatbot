module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.removeColumn('notification_queue', 'when_to_send'), // eslint-disable-line no-unused-vars

	down: (queryInterface, Sequelize) => queryInterface.addColumn('notification_queue', 'when_to_send', {
		allowNull: false, type: Sequelize.DATE,
	}),
};
