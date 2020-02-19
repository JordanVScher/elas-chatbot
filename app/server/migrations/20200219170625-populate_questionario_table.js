const { loadQuestionarioData } = require('../../utils/surveys/questionarios');


module.exports = {
	up: async (queryInterface) => {
		const data = await loadQuestionarioData();
		return queryInterface.bulkInsert('questionario', data);
	},

	down: (queryInterface) => queryInterface.bulkDelete('questionario', null, { truncate: true }),
};
