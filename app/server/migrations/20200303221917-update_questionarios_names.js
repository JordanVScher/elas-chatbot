module.exports = {
	up: (queryInterface) => {
		queryInterface.bulkUpdate('questionario', { name: 'modulo1' }, { name: 'module1' });
		queryInterface.bulkUpdate('questionario', { name: 'modulo2' }, { name: 'module2' });
		return queryInterface.bulkUpdate('questionario', { name: 'modulo3' }, { name: 'module3' });
	},
	down: (queryInterface) => {
		queryInterface.bulkUpdate('questionario', { name: 'module1' }, { name: 'modulo1' });
		queryInterface.bulkUpdate('questionario', { name: 'module2' }, { name: 'modulo2' });
		return queryInterface.bulkUpdate('questionario', { name: 'module3' }, { name: 'modulo3' });
	},
};
