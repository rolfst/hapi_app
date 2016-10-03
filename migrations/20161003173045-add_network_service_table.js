'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('network_service', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      network_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        references: {
          model: 'networks',
        },
        onDelete: 'cascade',
      },
      service_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        references: {
          model: 'services',
        },
        onDelete: 'cascade',
      },
      created_at: Sequelize.DATE,
    });
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
