module.exports = {
	up: (queryInterface) => queryInterface.bulkUpdate('notification_types', { id: 16 	}, { name: 'warningAluna'	}),
	down: (queryInterface) => queryInterface.bulkUpdate('notification_types', { id: 33 }, { name: 'warningAluna'	}),
};
