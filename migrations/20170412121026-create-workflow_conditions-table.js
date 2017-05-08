'use strict';

const { EConditionOperators } = require('../source/modules/workflow/definitions');

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface
      .createTable('workflow_conditions', {
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
        field: Sequelize.STRING,
        operator: Sequelize.ENUM.apply(null, Object.values(EConditionOperators)),
        value: Sequelize.STRING,
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
          .addIndex('workflow_conditions', ['workflow_id']);
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('workflow_conditions');
  }
};
