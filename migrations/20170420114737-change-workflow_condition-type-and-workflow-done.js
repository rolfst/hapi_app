'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface
        .changeColumn('workflow_conditions', 'value', Sequelize.TEXT),
      queryInterface
        .addColumn('workflows', 'done', Sequelize.BOOLEAN),
    ]);
  },

  down: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface
        .changeColumn('workflow_conditions', 'value', Sequelize.STRING),
      queryInterface
        .removeColumn('workflows', 'done'),
    ]);
  }
};
