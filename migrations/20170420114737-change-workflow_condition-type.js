'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface
      .changeColumn('workflow_conditions', 'value', Sequelize.TEXT);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface
      .changeColumn('workflow_conditions', 'value', Sequelize.STRING);
  }
};
