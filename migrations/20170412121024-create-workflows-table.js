'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface
      .createTable('workflows', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        organisation_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: 'organisations',
            key: 'id'
          },
          onDelete: 'cascade'
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        meta: {
          type: Sequelize.TEXT
        },
        start_date: Sequelize.DATE,
        expiration_date: Sequelize.DATE,
        last_check: Sequelize.DATE,
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
          .addIndex('workflows', ['organisation_id']);
      })
      .then(() => {
        return queryInterface
          .addIndex('workflows', ['start_date']);
      })
      .then(() => {
        return queryInterface
          .addIndex('workflows', ['expiration_date']);
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('workflows');
  }
};
