const oldChatbotText = `Olá, [NOMEUM],
Está chegando o grande dia, né? No final de semana do dia (início do Módulo 1) 

Todos os módulos serão realizados no
LOCAL - [LOCAL]

Nos dias: [FDSMOD1]; [FDSMOD2]; [FDSMOD3]

Importante chegar pontualmente! Procure ir com roupas confortáveis para aproveitar melhor o dia que será intenso. Iniciaremos o dia com um café da manhã reforçado. O almoço e estacionamento não estão inclusos 😘

Vou te mandar por aqui também as atividades necessárias em cada módulo!`;


const newChatbotText = `Olá, [NOMEUM],
Está chegando o grande dia, né? No final de semana dos dias [FDSMOD1]

Todos os módulos serão realizados no
LOCAL - [LOCAL]

Nos dias:\n[FDSMOD1]\n[FDSMOD2]\n[FDSMOD3]

Importante chegar pontualmente! Procure ir com roupas confortáveis para aproveitar melhor o dia que será intenso. Iniciaremos o dia com um café da manhã reforçado. O almoço e estacionamento não estão inclusos 😘

Vou te mandar por aqui também as atividades necessárias em cada módulo!`;

module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		chatbot_text: newChatbotText,
	}, {
		id: 1,
	}),

	down: (queryInterface, Sequelize) => queryInterface.bulkUpdate('notification_types', { // eslint-disable-line no-unused-vars
		chatbot_text: oldChatbotText,
	}, {
		id: 1,
	}),
};
