module.exports = {
	up: (queryInterface) => queryInterface.bulkUpdate('questionario', { id_surveymonkey: '276164561' }, { name: 'module1' }),
	down: (queryInterface) => queryInterface.bulkUpdate('questionario', { id_surveymonkey: '166464980' }, { name: 'module1' }),
};
