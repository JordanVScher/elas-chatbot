require('dotenv').config();

const notifications = {
	warningAluna: {
		subject: '[ LEMBRETE ] - Programa ELAS - Atividades para responder',
		text: `Olá, [NOMEUM],

Parece que falta você preencher alguns formulários para a nossa aula dessa semana:

[ATIVIDADES]

Beijos,
Equipe ELAS`,
		chatbotText: `Olá, [NOMEUM],

Parece que falta você preencher alguns formulários para a nossa aula dessa semana:

[ATIVIDADES]`,
	},
};

const result = [];
Object.keys(notifications).forEach(async (key) => {
	const element = notifications[key];
	const aux = {};

	aux.name = key;
	aux.created_at = new Date();
	aux.updated_at = new Date();
	if (element.subject) { aux.email_subject = element.subject; }
	if (element.text) { aux.email_text = element.text; }
	if (element.chatbotText) { aux.chatbot_text = element.chatbotText; }
	if (element.chatbotButton) { aux.chatbot_quick_reply = JSON.stringify(element.chatbotButton); }
	if (element.chatbotCard) { aux.chatbot_cards = JSON.stringify(element.chatbotCard); }
	if (element.anexo) { aux.attachment_name = element.anexo; }
	if (element.anexoLink) { aux.attachment_link = element.anexoLink; }
	result.push(aux);
});

module.exports = {
	up(queryInterface) {
		return queryInterface.bulkInsert('notification_types', result);
	},

	down(queryInterface) {
		return queryInterface.bulkDelete(
			'notification_types',
			{ name: 'warningAluna' }, {},
		);
	},
};
