module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.addColumn('chatbot_users', 'is_admin', { type: Sequelize.BOOLEAN, allowNull: true }), // eslint-disable-line no-unused-vars
	down: (queryInterface, Sequelize) => queryInterface.removeColumn('chatbot_users', 'is_admin'), // eslint-disable-line no-unused-vars
};
