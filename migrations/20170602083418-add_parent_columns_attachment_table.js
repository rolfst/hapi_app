'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('attachments', 'parent_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }),
      queryInterface.addColumn('attachments', 'parent_type', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
    ]);
  },

  down: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('attachments', 'parent_id'),
      queryInterface.removeColumn('attachments', 'parent_type'),
    ]);
  },
};
