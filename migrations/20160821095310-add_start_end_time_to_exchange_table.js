'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    const startTimeColumn = queryInterface.addColumn(
      'exchanges',
      'start_time',
      {
        type: Sequelize.DATE,
        allowNull: true,
      }
    );

    const endTimeColumn = queryInterface.addColumn(
      'exchanges',
      'end_time',
      {
        type: Sequelize.DATE,
        allowNull: true,
      }
    );

    return Promise.all([startTimeColumn, endTimeColumn]);
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
