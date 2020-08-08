module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.addColumn('notification_queue', 'additional_details', { type: Sequelize.JSON, allowNull: true }),
	down: (queryInterface) => queryInterface.removeColumn('notification_queue', 'additional_details'),
};
