'use strict';

module.exports = {
  up(queryInterface, Sequelize) {
    return queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: Sequelize.ENUM('GROUP', 'PRIVATE'),
        defaultValue: 'PRIVATE',
      },
      created_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        references: {
          model: 'users',
        },
        onDelete: 'cascade',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },
    });
  },

  down(queryInterface, Sequelize) {
    return queryInterface.dropTable('conversations');
  },
};
