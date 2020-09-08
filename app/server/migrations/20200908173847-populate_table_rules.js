const data = [
	// normal
	{
		notification_type: 1,
		modulo: 1,
		dias: -2,
	},
	{
		notification_type: 2,
		modulo: 1,
		dias: -11,
	},
	{
		notification_type: 3,
		modulo: 1,
		dias: -7,
		reenvio_dias: 6,
		indicado: true,
	},
	{
		notification_type: 4,
		modulo: 1,
		dias: -5,
	},
	{
		notification_type: 5,
		modulo: 1,
		dias: 1,
		horas: 20,
	},
	{
		notification_type: 6,
		modulo: 2,
		dias: -5,
	},
	{
		notification_type: 7,
		modulo: 2,
		dias: -1,
	},
	{
		notification_type: 8,
		modulo: 3,
		dias: -9,
		horas: 20,
	},
	{
		notification_type: 9,
		modulo: 3,
		dias: -9,
	},
	{
		notification_type: 10,
		modulo: 3,
		dias: -7,
		reenvio_dias: 3,
		indicado: true,
	},
	{
		notification_type: 11,
		modulo: 3,
		dias: -6,
	},
	{
		notification_type: 12,
		modulo: 3,
		dias: -2,
		indicado: true,
		familiar: true,
	},
	{
		notification_type: 13,
		modulo: 3,
		dias: 1,
	},
	{
		notification_type: 14,
		modulo: 1,
		horas: -24,
	},
	{
		notification_type: 14,
		modulo: 2,
		horas: -24,
	},
	{
		notification_type: 14,
		modulo: 3,
		horas: -24,
	},
	{
		notification_type: 15,
		modulo: 1,
		domingo: false,
		horas: -1,
	},
	{
		notification_type: 15,
		modulo: 1,
		domingo: true,
		horas: 23,
	},
	{
		notification_type: 15,
		modulo: 2,
		domingo: false,
		horas: -1,
	},
	{
		notification_type: 15,
		modulo: 2,
		domingo: true,
		horas: -23,
	},
	{
		notification_type: 15,
		modulo: 3,
		domingo: false,
		horas: -1,
	},
	{
		notification_type: 15,
		modulo: 3,
		domingo: true,
		horas: -23,
	},
	{
		notification_type: 16,
		modulo: 1,
		dias: -2,
	},
	{
		notification_type: 16,
		modulo: 2,
		dias: -2,
	},
	{
		notification_type: 16,
		modulo: 3,
		dias: -2,
	},
	// in company
	{
		notification_type: 17,
		modulo: 1,
		dias: -2,
	},
	{
		notification_type: 18,
		modulo: 1,
		dias: -11,
	},
	{
		notification_type: 19,
		modulo: 1,
		dias: -7,
		reenvio_dias: 6,
		indicado: true,
	},
	{
		notification_type: 20,
		modulo: 1,
		dias: -5,
	},
	{
		notification_type: 21,
		modulo: 1,
		dias: 1,
		horas: 20,
	},
	{
		notification_type: 22,
		modulo: 2,
		dias: -5,
	},
	{
		notification_type: 23,
		modulo: 2,
		dias: -1,
	},
	{
		notification_type: 24,
		modulo: 3,
		dias: -9,
		horas: 20,
	},
	{
		notification_type: 25,
		modulo: 3,
		dias: -9,
	},
	{
		notification_type: 26,
		modulo: 3,
		dias: -7,
		reenvio_dias: 3,
		indicado: true,
	},
	{
		notification_type: 27,
		modulo: 3,
		dias: -6,
	},
	{
		notification_type: 28,
		modulo: 3,
		dias: -2,
		indicado: true,
		familiar: true,
	},
	// {
	// 	notification_type: 29,
	// 	modulo: 3,
	// 	dias: 1,
	// },
	{
		notification_type: 30,
		modulo: 1,
		horas: -24,
	},
	{
		notification_type: 30,
		modulo: 2,
		horas: -24,
	},
	{
		notification_type: 30,
		modulo: 3,
		horas: -24,
	},
	{
		notification_type: 31,
		modulo: 1,
		domingo: false,
		horas: -1,
	},
	{
		notification_type: 31,
		modulo: 1,
		domingo: true,
		horas: 23,
	},
	{
		notification_type: 31,
		modulo: 2,
		domingo: false,
		horas: -1,
	},
	{
		notification_type: 31,
		modulo: 2,
		domingo: true,
		horas: -23,
	},
	{
		notification_type: 31,
		modulo: 3,
		domingo: false,
		horas: -1,
	},
	{
		notification_type: 31,
		modulo: 3,
		domingo: true,
		horas: -23,
	},
	{
		notification_type: 32,
		modulo: 1,
		dias: -2,
	},
	{
		notification_type: 32,
		modulo: 2,
		dias: -2,
	},
	{
		notification_type: 32,
		modulo: 3,
		dias: -2,
	},
];


module.exports = {
  up(queryInterface, Sequelize) { // eslint-disable-line
		data.forEach((e) => {
			e.created_at = new Date();
			e.updated_at = new Date();
		});


		return queryInterface.bulkInsert('notification_rules', data);
	},

	down(queryInterface, Sequelize) {
		return queryInterface.bulkDelete(
			'notification_rules',
			{ id: { [Sequelize.Op.gte]: 1 } }, {},
		);
	},
};
