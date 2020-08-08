module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 10000, // new value
		name: 'mail10000',
	}, {
		id: 13, // old value
	}),

	down: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 13,
		name: 'mail13',
	}, {
		id: 10000,
	}),
};
