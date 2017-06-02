'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addIndex('network_user', ['user_token']);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeIndex('network_user', ['user_token']);
  }
};
