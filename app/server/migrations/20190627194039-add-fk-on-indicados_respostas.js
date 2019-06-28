

module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.addConstraint('indicados_respostas', ['indicado_id'], {
		type: 'foreign key',
		name: 'indicado_id_fk',
		references: {
			table: 'indicacao_avaliadores',
			field: 'id',
			onDelete: 'cascade',
			onUpdate: 'cascade',
		},
	}),

	down: (queryInterface, Sequelize) => queryInterface.removeConstraint('indicados_respostas', 'indicado_id_fk'),
};
