const originalData = [
	{ id: 1, dias: -2 },
	{ id: 2, dias: -11 },
	{ id: 3, dias: -7, reenvio_dias: 6 },
	{ id: 4, dias: -5 },
	{ id: 5, dias: 1, horas: 20 },
	{ id: 6, dias: -5 },
	{ id: 7, dias: -1 },
	{ id: 8, dias: -9, horas: 20 },
	{ id: 9, dias: -9 },
	{ id: 10, dias: -7, reenvio_dias: 3 },
	{ id: 11, dias: -6 },
	{ id: 12, dias: -2 },
	{ id: 13, dias: 1 },
	{ id: 14, horas: -24 },
	{ id: 15, horas: -24 },
	{ id: 16, horas: -24 },
	{ id: 17, horas: -1 },
	{ id: 18, horas: 23 },
	{ id: 19, horas: -1 },
	{ id: 20, horas: -23 },
	{ id: 21, horas: -1 },
	{ id: 22, horas: -23 },
	{ id: 23, dias: -2 },
	{ id: 24, dias: -2 },
	{ id: 25, dias: -2 },
	{ id: 26, dias: -2 },
	{ id: 27, dias: -11 },
	{ id: 28, dias: -7, reenvio_dias: 6 },
	{ id: 29, dias: -5 },
	{ id: 30, dias: 1, horas: 20 },
	{ id: 31, dias: -5 },
	{ id: 32, dias: -1 },
	{ id: 33, dias: -9, horas: 20 },
	{ id: 34, dias: -9 },
	{ id: 35, dias: -7, reenvio_dias: 3 },
	{ id: 36, dias: -6 },
	{ id: 37, dias: -2 },
	{ id: 38, horas: -24 },
	{ id: 39, horas: -24 },
	{ id: 40, horas: -24 },
	{ id: 41, horas: -1 },
	{ id: 42, horas: 23 },
	{ id: 43, horas: -1 },
	{ id: 44, horas: -23 },
	{ id: 45, horas: -1 },
	{ id: 46, horas: -23 },
	{ id: 47, dias: -2 },
	{ id: 48, dias: -2 },
	{ id: 49, dias: -2 },
];

module.exports = {
	up(queryInterface) {
		return queryInterface.bulkUpdate('notification_rules', {
			horas: null,
			dias: null,
			reenvio_dias: null,
		});
	},

	down: async (queryInterface) => {
		console.log('originalData.length', originalData.length);
		for (let i = 0; i < originalData.length - 1; i++) {
			const e = originalData[i];

			await queryInterface.bulkUpdate('notification_rules', {
				horas: e.horas || null,
				dias: e.dias || null,
				reenvio_dias: e.reenvio_dias || null,
			}, { id: e.id });
		}

		const lastOne = originalData[originalData.length - 1];

		return queryInterface.bulkUpdate('notification_rules', {
			horas: lastOne.horas || null,
			dias: lastOne.dias || null,
			reenvio_dias: lastOne.reenvio_dias || null,
		}, { id: lastOne.id });
	},
};


// queryInterface.bulkUpdate('roles', {
// 	label: 'admin',
// }, {
// 	userType: 3,
// });
