'use strict';

const { ETriggerTypes } = require('../source/modules/workflow/h');

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface
      .createTable('workflow_triggers', {
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
        type: {
          type: Sequelize.ENUM.apply(null, Object.values(ETriggerTypes)),
          allowNull: false
        },
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
      }, {
        charset: 'utf8',
        collate: 'utf8_unicode_ci'
      })
      .then(() => {
        return queryInterface
          .addIndex('workflow_triggers', ['workflow_id']);
      })
      .then(() => {
        return queryInterface
          .addIndex('workflow_triggers', ['type']);
      })
      .then(() => {
        return queryInterface
          .addIndex('workflow_triggers', ['value']);
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('workflow_triggers');
  }
};
