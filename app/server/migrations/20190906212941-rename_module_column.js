
module.exports = {
	up: (queryInterface, Sequelize) => queryInterface.renameColumn('aluno_turma_changelog', 'turma_modulo', 'modulo_original'), // eslint-disable-line no-unused-vars
	down: (queryInterface, Sequelize) => queryInterface.renameColumn('aluno_turma_changelog', 'modulo_original', 'turma_modulo'), // eslint-disable-line no-unused-vars
};
