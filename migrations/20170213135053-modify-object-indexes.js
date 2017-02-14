'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.removeIndex('objects', ['object_type', 'source_id'])
      .then(() => queryInterface.addIndex('objects', ['parent_type', 'parent_id']));
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
