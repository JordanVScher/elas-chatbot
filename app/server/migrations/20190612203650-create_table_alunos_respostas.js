
module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('alunos_respostas', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			aluno_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			pre: {
				type: Sequelize.JSON,
				allowNull: true,
			},
			pos: {
				type: Sequelize.JSON,
				allowNull: true,
			},
			atividade_1: {
				type: Sequelize.BOOLEAN,
				allowNull: true,
				defaultValue: false,
			},
			atividade_2: {
				type: Sequelize.BOOLEAN,
				allowNull: true,
				defaultValue: false,
			},
			atividade_modulo1: {
				type: Sequelize.BOOLEAN,
				allowNull: true,
				defaultValue: false,
			},
			atividade_modulo2: {
				type: Sequelize.BOOLEAN,
				allowNull: true,
				defaultValue: false,
			},
			atividade_modulo3: {
				type: Sequelize.BOOLEAN,
				allowNull: true,
				defaultValue: false,
			},
			atividade_indicacao: {
				type: Sequelize.BOOLEAN,
				allowNull: true,
				defaultValue: false,
			},
			atividade_avaliador: {
				type: Sequelize.BOOLEAN,
				allowNull: true,
				defaultValue: false,
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
		return queryInterface.dropTable('alunos_respostas');
	},
};
