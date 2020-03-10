const newCards = [{
	title: 'ATIVIDADE 1 - SONDAGEM DE FOCO', subtitle: 'Preencha novamente para avaliarmos a mudança percebida por você.', image_url: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/c8cc8280-7c73-4caf-a07c-2a84bdd4bb93.jpg', url: 'https://pt.surveymonkey.com/r/6TP5523?cpf=CPFRESPOSTA',
}, {
	title: 'ATIVIDADE 2 - INVENTÁRIO COMPORTAMENTAL', subtitle: 'Houve mudanças? Refaça o DISC!', image_url: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/9f6a19c4-571b-429f-b628-8ef4cedda1a9.jpg', url: '[DISC_LINK]',
}, {
	title: 'ATIVIDADE 3 - LEITURA', subtitle: 'Leia e avalie como ele poderia ser implantado no seu dia-a-dia, anote as dúvidas', image_url: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/fde11d8c-e516-4fa8-8536-474d20ab99d3.jpg', url: 'https://drive.google.com/file/d/1PhHc7vHFCVV4N3uT7Qe8Lc5IYimdQ6oT/view?usp=sharing',
}];


const oldCards = [{
	title: 'ATIVIDADE 1 - SONDAGEM DE FOCO', subtitle: 'Preencha novamente para avaliarmos a mudança percebida por você.', image_url: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/c8cc8280-7c73-4caf-a07c-2a84bdd4bb93.jpg', url: 'https://pt.surveymonkey.com/r/6TP5523?cpf=CPFRESPOSTA',
}, {
	title: 'ATIVIDADE 2 - INVENTÁRIO COMPORTAMENTAL', subtitle: 'Houve mudanças? Refaça o DISC!', image_url: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/9f6a19c4-571b-429f-b628-8ef4cedda1a9.jpg', url: 'http://disc.etalent.pro/?grpS9gr4UYnMkOekPk7DJDmYA',
}, {
	title: 'ATIVIDADE 3 - LEITURA', subtitle: 'Leia e avalie como ele poderia ser implantado no seu dia-a-dia, anote as dúvidas', image_url: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/fde11d8c-e516-4fa8-8536-474d20ab99d3.jpg', url: 'https://drive.google.com/file/d/1PhHc7vHFCVV4N3uT7Qe8Lc5IYimdQ6oT/view?usp=sharing',
}];


module.exports = {
	up: (queryInterface) => {
		queryInterface.bulkUpdate('notification_types', { chatbot_cards: JSON.stringify(newCards) }, { id: 7 });
		return queryInterface.bulkUpdate('notification_types', { chatbot_cards: JSON.stringify(newCards) }, { id: 25 });
	},

	down: (queryInterface) => {
		queryInterface.bulkUpdate('notification_types', { chatbot_cards: JSON.stringify(oldCards) }, { id: 7 });
		return queryInterface.bulkUpdate('notification_types', { chatbot_cards: JSON.stringify(oldCards) }, { id: 25 });
	},
};
