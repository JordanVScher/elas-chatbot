module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.addColumn('notification_queue', 'sent_at_chatbot', { type: Sequelize.DATE, allowNull: true }), // eslint-disable-line no-unused-vars
	down: (queryInterface) => queryInterface.removeColumn('notification_queue', 'sent_at_chatbot'),
};
