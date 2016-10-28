'use strict';

module.exports = {
  up(queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'network_service',
      'imported_at',
      {
        type: Sequelize.DATE,
        allowNull: true,
      }
    );
  },

  down(queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
};
