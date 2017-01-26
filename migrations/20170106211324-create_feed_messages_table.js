'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.renameTable('messages', 'old_messages').then(() =>
      queryInterface.createTable('feed_messages', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        object_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          references: {
            model: 'objects',
            key: 'id',
          },
          onDelete: 'cascade',
        },
        text: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        likes_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        comments_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          allowNull: false,
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          allowNull: false,
        },
      })
    );
  },

  down: function (queryInterface, Sequelize) {
  }
};
