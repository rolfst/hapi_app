'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface
      .createTable('object_seen', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        object_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: 'objects',
            key: 'id',
          },
          onDelete: 'cascade',
        },
        user_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'set null',
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          allowNull: false,
        }
      })
      .then(() => {
        return queryInterface
          .addIndex('object_seen',
            ['object_id', 'user_id'],
            { indicesType: 'UNIQUE' });
      })
      .then(() => {
        return queryInterface
          .addIndex('object_seen', ['object_id']);
      })
      .then(() => {
        return queryInterface
          .addIndex('object_seen', ['user_id']);
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('object_seen');
  }
};
