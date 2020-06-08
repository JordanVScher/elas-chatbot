const { getSurveyDetails } = require('../../sm_api');
const toAdd = require('../../utils/sm_surveys').atividade1InCompany;

const data = {
	id_surveymonkey: toAdd.id,
	link: toAdd.link.substring(0, toAdd.link.indexOf('?')),
	name: 'atividade1InCompany',
	parameters: '{ "pgid": "PSIDRESPOSTA", "turma": "TURMARESPOSTA" }',
	created_at: new Date(),
	updated_at: new Date(),
};

// why this might fail: this questionario might already be saved in the database!
module.exports = {
	up: async (queryInterface) => {
		console.log('data', data);
		data.details = await getSurveyDetails(data.id_surveymonkey);
		data.details = JSON.stringify(data.details);
		return queryInterface.bulkInsert('questionario', [data]);
	},

	down: (queryInterface) => queryInterface.bulkDelete('questionario', { name: 'atividade1InCompany' }),
};
