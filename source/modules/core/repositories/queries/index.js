const R = require('ramda');
const sequelize = require('../../../../shared/configs/sequelize');

const pluckIds = R.pluck('id');

const executeQuery = (query, params) => {
  return sequelize.query(query, { replacements: params, type: sequelize.QueryTypes.SELECT });
};

const FETCH_ELIGIBLE_TEAM_IDS = `
SELECT
  DISTINCT t.id
FROM
  teams t
  LEFT JOIN team_user tu ON tu.team_id = t.id
  JOIN networks n ON t.network_id = n.id
  LEFT JOIN network_user nu ON nu.network_id = n.id
  JOIN organisation_user ou ON n.organisation_id = ou.organisation_id
WHERE
  n.organisation_id = :organisationId
  AND (
       (ou.role_type = 'ADMIN' AND ou.user_id = :userId)
    OR (nu.role_type = 'ADMIN' AND nu.user_id = :userId)
    OR tu.user_id = :userId
  )
;
`;

const FETCH_ELIGIBLE_NETWORK_IDS = `
SELECT
  DISTINCT n.id
FROM
  networks n
  LEFT JOIN network_user nu ON nu.network_id = n.id
  JOIN organisation_user ou ON n.organisation_id = ou.organisation_id
WHERE
  n.organisation_id = :organisationId
  AND (
       (ou.role_type = 'ADMIN' AND ou.user_id = :userId)
    OR (nu.role_type = 'ADMIN' AND nu.user_id = :userId)
    OR nu.user_id = :userId
  )
;
`;

exports.QUERIES = {
  FETCH_ELIGIBLE_NETWORK_IDS,
  FETCH_ELIGIBLE_TEAM_IDS,
};

exports.executeQuery = executeQuery;
exports.pluckIds = pluckIds;
