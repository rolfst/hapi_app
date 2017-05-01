'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise
      .all([
        queryInterface
          .addColumn('organisation_user', 'invited_at', Sequelize.DATE),
        queryInterface
          .addColumn('organisation_user', 'deleted_at', Sequelize.DATE),
        queryInterface
          .addColumn('organisation_user', 'external_id', Sequelize.STRING)
      ])
      .then(function () {
        return Promise.all([
          queryInterface
            .addIndex('organisation_user', ['invited_at']),
          queryInterface
            .addIndex('organisation_user', ['deleted_at']),
          queryInterface
            .addIndex('organisation_user', ['external_id'])
        ]);
      });
  },

  down: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface
        .removeColumn('organisation_user', 'invited_at'),
      queryInterface
        .removeColumn('organisation_user', 'deleted_at'),
      queryInterface
        .removeColumn('organisation_user', 'external_id')
    ]);
  }
};

/*
  -- migration query per organisation, keeping it here because we don't have a .sql folder

INSERT INTO
  organisation_user (
    organisation_id,
    user_id,
    role_type,
    function_id,
    invited_at,
    deleted_at,
    external_id,
    created_at,
    updated_at
  )
SELECT
  1 organisation_id,
  nu.user_id user_id,
  'EMPLOYEE' role_type,
  null function_id,
  MIN(nu.invited_at) invited_at,
  CASE
    WHEN COUNT(nu.deleted_at IS NULL) > 0
      THEN NULL
	  ELSE MAX(nu.deleted_at)
  END deleted_at,
  null external_id,
  MIN(nu.invited_at) created_at,
  NOW() updated_at
FROM
  network_user nu
WHERE
  -- network id's
  nu.id IN (
    1, 2, 3
  )
GROUP BY
  nu.user_id
;

*/

