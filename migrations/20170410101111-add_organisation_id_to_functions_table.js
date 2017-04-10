'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('organization_functions', 'organization_id', {
      after: 'id',
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'organisations',
        key: 'id'
      },
      onDelete: 'set null'
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('organization_functions', 'organization_id');
  }
};
