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
            key: 'id'
          }
        },
        user_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
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
