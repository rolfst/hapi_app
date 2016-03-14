'use strict';

module.exports = {
  up(queryInterface, Sequelize) {
    return queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.INTEGER,
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
      created_at: Sequelize.DATE,
    });
  },

  down(queryInterface, Sequelize) {
    return queryInterface.dropTable('conversations');
  },
};
