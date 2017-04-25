'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface
      .addColumn('organisations', 'external_config', Sequelize.TEXT);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface
      .removeColumn('organisations', 'external_config');
  }
};
