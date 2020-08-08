const newText = '[{ content_type: \'text\', title: \'Ver atividades Mod 1\', payload: \'Atividade2\' }]';
const original = '[{ content_type: \'text\', title: \'Entendi\', payload: \'Atividade2\' }]';

module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		chatbot_quick_reply: newText,
	}, {
		id: { [Sequelize.Op.or]: [1, 17] },
	}),

	down: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		chatbot_quick_reply: original,
	}, {
		id: { [Sequelize.Op.or]: [1, 17] },
	}),
};
