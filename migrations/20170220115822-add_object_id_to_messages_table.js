'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([queryInterface.addColumn('messages', 'object_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'objects',
        key: 'id',
      },
      onDelete: 'cascade',
    }), queryInterface.addColumn('messages', 'likes_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    }), queryInterface.addColumn('messages', 'comments_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    }),
    ]);
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
