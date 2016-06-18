'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn(
        'exchanges',
        'accept_count',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        }
      ),
      queryInterface.addColumn(
        'exchanges',
        'decline_count',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        }
      ),
      queryInterface.addColumn(
        'exchanges',
        'approved_user',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'set null',
        }
      )
    ]);
  },

  down: function (queryInterface, Sequelize) {
    //
  }
};
