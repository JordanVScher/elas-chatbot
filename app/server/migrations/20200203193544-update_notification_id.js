module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 10, // new value
		name: 'mail10',
	}, {
		id: 11, // old value
	}),

	down: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 11,
		name: 'mail11',
	}, {
		id: 10,
	}),
};
