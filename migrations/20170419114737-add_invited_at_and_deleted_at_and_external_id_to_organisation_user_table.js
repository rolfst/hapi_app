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
    n.organisation_id organisation_id,
    nu.user_id user_id,
    'EMPLOYEE' role_type,
    null function_id,
    MIN(IF(nu.invited_at IS NULL, null, nu.invited_at)) invited_at,
    CASE
      WHEN COUNT(nu.deleted_at IS NULL) > 0
        THEN NULL
        ELSE MAX(IF(nu.deleted_at IS NULL, null, nu.deleted_at))
    END deleted_at,
    NULL external_id,
    MIN(IF(nu.invited_at IS NULL, NOW(), nu.invited_at)) created_at,
    NOW() updated_at
  FROM
    network_user nu
    LEFT JOIN networks n ON n.id = nu.network_id
  WHERE
    NOT n.organisation_id IS NULL
  GROUP BY
    CONCAT(nu.user_id, n.organisation_id)
  ;

*/
