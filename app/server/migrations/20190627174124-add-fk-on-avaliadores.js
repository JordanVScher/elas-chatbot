'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addConstraint('indicacao_avaliadores', ['aluno_id'], {
        type: 'foreign key',
        name: 'aluno_id_fk',
        references: {
            table: 'alunos',
            field: 'id',
            onDelete: 'cascade',
            onUpdate: 'cascade'
        }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint('indicacao_avaliadores', 'aluno_id_fk');
  }
};
