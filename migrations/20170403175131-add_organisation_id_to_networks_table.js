'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('networks', 'organisation_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'organisations',
        key: 'id',
      },
      onDelete: 'set null',
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('networks', 'organisation_id');
  }
};
