const notifications = {
	inCompanyWarningAluna: {
		subject: 'Programa Elas - Ops! Acho Que Você Esqueceu de Preencher as Atividades',
		text: `Olá, [NOMEUM],

Parece que falta você preencher alguns formulários para a nossa aula dessa semana:

[ATIVIDADES]

E se você tenha esquecido de responder seu Inventário Corportamental responda nesse link:
[DISC_LINK]

Beijos,
Equipe ELAS`,
		chatbotText: `Olá, [NOMEUM],

Parece que falta você preencher alguns formulários para a nossa aula dessa semana:

[ATIVIDADES]

E se você tenha esquecido de responder seu Inventário Corportamental responda nesse link:
[DISC_LINK]`,
		chatbotButton: null,
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
  up(queryInterface) { // eslint-disable-line
		return queryInterface.bulkInsert('notification_types', result);
	},

	down(queryInterface) {
		return queryInterface.bulkDelete(
			'notification_types',
			{ name: 'inCompanyWarningAluna' }, {},
		);
	},
};
