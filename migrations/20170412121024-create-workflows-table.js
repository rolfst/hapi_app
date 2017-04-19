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
        return Promise.all([
          queryInterface
            .addIndex('workflows', ['organisation_id']),
          queryInterface
            .addIndex('workflows', ['start_date']),
          queryInterface
            .addIndex('workflows', ['expiration_date']),
          queryInterface
            .addIndex('workflows', ['last_check'])
        ]);
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('workflows');
  }
};
