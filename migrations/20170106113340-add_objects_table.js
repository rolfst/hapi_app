'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('objects', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
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
      object_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      source_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      parent_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    }).then(() => {
      return queryInterface.addIndex('objects',
        ['object_type', 'source_id'],
        { indicesType: 'UNIQUE' });
    }).then(() => {
      return queryInterface.addIndex('objects',
        ['parent_type', 'parent_id'],
        { indicesType: 'UNIQUE' });
    });
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
