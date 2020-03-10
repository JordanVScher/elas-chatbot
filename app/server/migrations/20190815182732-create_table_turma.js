module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('turma', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			nome: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			status: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			local: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			in_company: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			pagseguro_id: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			horario_modulo1: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			horario_modulo2: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			horario_modulo3: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});
	},
	down(queryInterface) {
		return queryInterface.dropTable('turma');
	},
};
