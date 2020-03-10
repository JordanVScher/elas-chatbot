module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.addColumn('indicacao_avaliadores', 'relacao_com_aluna', Sequelize.STRING, {
			allowNull: true,
		});
	},

	down: (queryInterface, Sequelize) => queryInterface.removeColumn('indicacao_avaliadores', 'relacao_com_aluna', Sequelize.STRING, {}),
};
