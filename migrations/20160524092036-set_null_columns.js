'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    const p1 = queryInterface.changeColumn('teams', 'description', {
      type: Sequelize.TEXT('medium'),
      allowNull: true,
    });

    const p2 = queryInterface.changeColumn('exchanges', 'description', {
      type: Sequelize.TEXT('medium'),
      allowNull: true,
    });

    return Promise.all([p1, p2]);
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
