module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 11, // new value
		name: 'mail11',
	}, {
		id: 1000, // old value
	}),

	down: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 1000,
		name: 'mail1000',
	}, {
		id: 11,
	}),
};
