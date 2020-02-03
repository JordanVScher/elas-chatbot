module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 8, // new value
		name: 'mail8',
	}, {
		id: 9, // old value
	}),

	down: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 9,
		name: 'mail9',
	}, {
		id: 8,
	}),
};
