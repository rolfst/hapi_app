'use strict';

module.exports = {
  up(queryInterface, Sequelize) {
    return queryInterface.createTable('conversation_user', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      conversation_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        references: {
          model: 'conversations',
        },
        onDelete: 'cascade',
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        references: {
          model: 'users',
        },
        onDelete: 'cascade',
      },
    });
  },

  down(queryInterface, Sequelize) {
    return queryInterface.dropTable('conversation_user');
  },
};
