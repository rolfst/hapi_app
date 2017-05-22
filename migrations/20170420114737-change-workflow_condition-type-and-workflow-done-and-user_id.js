'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface
        .changeColumn('workflow_conditions', 'value', Sequelize.TEXT),
      queryInterface
        .addColumn('workflows', 'done', Sequelize.BOOLEAN),
      queryInterface
        .addColumn('workflows', 'user_id', {
          type: Sequelize.INTEGER.UNSIGNED,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'set null'
        }),
    ]);
  },

  down: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface
        .changeColumn('workflow_conditions', 'value', Sequelize.STRING),
      queryInterface
        .removeColumn('workflows', 'done'),
      queryInterface
        .removeColumn('workflows', 'user_id'),
    ]);
  }
};
