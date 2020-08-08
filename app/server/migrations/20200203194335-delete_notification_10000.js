module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.bulkDelete('notification_types', { // eslint-disable-line no-unused-vars
		id: 10000,
	}),

	down: (queryInterface, Sequelize) => queryInterface.bulkDelete('notification_types', { // eslint-disable-line no-unused-vars
		id: 10000,
	}),
};
