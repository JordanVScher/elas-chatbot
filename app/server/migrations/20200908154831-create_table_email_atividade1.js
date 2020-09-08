
module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('mail_atividade1', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			assunto: {
				allowNull: false,
				type: Sequelize.STRING,
			},
			texto1: {
				allowNull: true,
				type: Sequelize.STRING,
			},
			texto2: {
				allowNull: true,
				type: Sequelize.STRING,
			},
			texto3: {
				allowNull: true,
				type: Sequelize.STRING,
			},
			texto4: {
				allowNull: true,
				type: Sequelize.STRING,
			},
			in_company: {
				allowNull: false,
				type: Sequelize.BOOLEAN,
			},
			created_at: {
				allowNull: false,
				type: Sequelize.DATE,
			},
			updated_at: {
				allowNull: false,
				type: Sequelize.DATE,
			},
		});
	},
	down(queryInterface) {
		return queryInterface.dropTable('mail_atividade1');
	},
};
