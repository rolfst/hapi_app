'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addIndex(
      'users',
      ['username'],
      {
        indicesType: 'UNIQUE',
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeIndex('users', ['username']);
  }
};
