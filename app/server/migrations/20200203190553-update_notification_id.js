module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 10001, // new value
		name: 'mail10001',
	}, {
		id: 29, // old value
	}),

	down: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 29,
		name: 'mail29',
	}, {
		id: 10001,
	}),
};
