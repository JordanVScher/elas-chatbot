module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 13, // new value
		name: 'mail13',
	}, {
		id: 14, // old value
	}),

	down: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		id: 14,
		name: 'mail14',
	}, {
		id: 13,
	}),
};
