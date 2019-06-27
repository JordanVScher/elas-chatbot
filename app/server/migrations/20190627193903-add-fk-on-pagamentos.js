'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('pagamentos', 'aluno_id', {
        type: Sequelize.INTEGER,
        references: {
            model: 'alunos',
            key: 'id'
        }
    })
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.removeColumn('pagamentos', 'aluno_id');
  }
};
