module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 9, // new value
		name: 'mail9',
	}, {
		id: 10, // old value
	}),

	down: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 10,
		name: 'mail10',
	}, {
		id: 9,
	}),
};
