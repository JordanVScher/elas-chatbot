const { addOriginalTypeToNotificationQueue, removeOriginalTypeToNotificationQueue } = require('../../utils/DB_helper');

module.exports = {
	up: async (queryInterface) => {
		await addOriginalTypeToNotificationQueue();
		return queryInterface.bulkUpdate('chatbot_users', { updated_at: new Date() }, { id: 50000 });
	},


	down: async (queryInterface) => {
		await removeOriginalTypeToNotificationQueue();
		return queryInterface.bulkUpdate('chatbot_users', { updated_at: new Date() }, { id: 50000 });
	},
};
