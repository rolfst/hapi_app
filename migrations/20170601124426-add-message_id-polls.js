'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('polls', 'message_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'messages',
        key: 'id',
      },
      onDelete: 'cascade',
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('polls', 'message_id');
  }
};
