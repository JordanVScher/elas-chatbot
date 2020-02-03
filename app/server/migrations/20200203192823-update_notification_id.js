module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 7, // new value
		name: 'mail7',
	}, {
		id: 8, // old value
	}),

	down: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 8,
		name: 'mail8',
	}, {
		id: 7,
	}),
};
