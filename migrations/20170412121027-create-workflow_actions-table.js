'use strict';

const { EActionTypes } = require('../source/modules/workflow/h');

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface
      .createTable('workflow_actions', {
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
        type: Sequelize.ENUM.apply(null, Object.values(EActionTypes)),
        meta: Sequelize.TEXT,
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
          .addIndex('workflow_actions', ['workflow_id']);
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('workflow_actions');
  }
};
