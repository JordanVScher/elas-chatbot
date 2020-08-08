module.exports = {
	up(queryInterface, Sequelize) {
		queryInterface.addColumn('alunos', 'telefone', {
			type: Sequelize.STRING,
		});

		queryInterface.addColumn('alunos', 'rg', {
			type: Sequelize.STRING,
		});

		queryInterface.addColumn('alunos', 'endereco', {
			type: Sequelize.STRING,
		});

		queryInterface.addColumn('alunos', 'data_nascimento', {
			type: Sequelize.STRING,
		});

		queryInterface.addColumn('alunos', 'contato_emergencia_nome', {
			type: Sequelize.STRING,
		});

		queryInterface.addColumn('alunos', 'contato_emergencia_email', {
			type: Sequelize.STRING,
		});

		queryInterface.addColumn('alunos', 'contato_emergencia_fone', {
			type: Sequelize.STRING,
		});

		return queryInterface.addColumn('alunos', 'contato_emergencia_relacao', {
			type: Sequelize.STRING,
		});
	},

	down: (queryInterface, Sequelize) => {
		queryInterface.removeColumn('alunos', 'telefone');
		queryInterface.removeColumn('alunos', 'rg');
		queryInterface.removeColumn('alunos', 'endereco');
		queryInterface.removeColumn('alunos', 'data_nascimento');
		queryInterface.removeColumn('alunos', 'contato_emergencia_nome');
		queryInterface.removeColumn('alunos', 'contato_emergencia_email');
		queryInterface.removeColumn('alunos', 'contato_emergencia_fone');
		return queryInterface.removeColumn('alunos', 'contato_emergencia_relacao');
	},
};
