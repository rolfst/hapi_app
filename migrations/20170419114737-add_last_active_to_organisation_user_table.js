'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface
      .addColumn('organisation_user', 'last_active', Sequelize.DATE)
      .then(function () {
        return queryInterface
          .addIndex('organisation_user', ['last_active']);
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface
      .removeColumn('organisation_user', 'last_active');
  }
};

/*
migration query:

UPDATE
  organisation_user ou
SET
  ou.last_active = (
    SELECT
      MAX(last_active)
    FROM
      network_user nu
    WHERE
      nu.user_id = ou.user_id
  )
WHERE
  id > 0;
 */
