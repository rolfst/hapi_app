'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface
      .addColumn('workflow_actions', 'source_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      })
      .then(function () {
        return queryInterface
          .addIndex('workflow_actions', ['source_id']);
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface
      .removeColumn('workflow_actions', 'source_id');
  }
};
