'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('network_user', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      network_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'networks',
          key: 'id',
        },
        onDelete: 'cascade',
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'cascade',
      },
      role_type: {
        type: Sequelize.ENUM('EMPLOYEE', 'ADMIN'),
        allowNull: false,
        defaultValue: 'EMPLOYEE',
      },
      unread_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      last_active: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reminded_at: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      is_welcomed: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('network_user')
  }
};
