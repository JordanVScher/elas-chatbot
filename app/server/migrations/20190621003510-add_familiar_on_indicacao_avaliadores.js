module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.addColumn('indicacao_avaliadores', 'familiar', Sequelize.BOOLEAN, {
			allowNull: true,
		});
	},

	down: (queryInterface, Sequelize) => queryInterface.removeColumn('indicacao_avaliadores', 'familiar', Sequelize.BOOLEAN, {
		allowNull: true,
	}),
};
