'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    // Note: This field was supposed to go after `id`, but sequelize puts the AFTER
    //         expression before the REFERENCES expression which mysql does not like
    return queryInterface.addColumn('organisation_functions', 'organisation_id', {
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
    return queryInterface.removeColumn('organisation_functions', 'organisation_id');
  }
};
