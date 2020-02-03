module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 1000,
		name: 'mail1000',
	}, {
		id: 7,
	}),

	down: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 7,
		name: 'mail7',
	}, {
		id: 1000,
	}),
};
