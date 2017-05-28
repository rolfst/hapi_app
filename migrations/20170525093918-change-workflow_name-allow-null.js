'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface
      .changeColumn('workflows', 'name', {
        type: Sequelize.STRING,
        allowNull: true
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface
      .changeColumn('workflows', 'name', {
        type: Sequelize.STRING,
        allowNull: false
      });
  }
};
