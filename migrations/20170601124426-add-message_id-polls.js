'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('polls', 'message_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'messages',
          key: 'id',
        },
        onDelete: 'cascade',
      }),
      queryInterface.removeColumn('polls', 'network_id'),
    ]);
  },

  down: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('polls', 'message_id'),
      queryInterface.addColumn('polls', 'network_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'networks',
          key: 'id',
        },
        onDelete: 'cascade',
      }),
    ]);
  }
};
