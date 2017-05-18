'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface
      .createTable('workflow_actionsdone', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        workflow_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: 'workflows',
            key: 'id'
          },
          onDelete: 'cascade'
        },
        user_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'cascade'
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          allowNull: false
        }
      })
      .then(() => {
        return queryInterface
          .addIndex('workflow_actionsdone', ['workflow_id']);
      })
      .then(() => {
        return queryInterface
          .addIndex('workflow_actionsdone', ['user_id']);
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('workflow_actionsdone');
  }
};
