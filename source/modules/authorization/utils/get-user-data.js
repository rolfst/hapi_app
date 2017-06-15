const R = require('ramda');
const userRepo = require('../../core/repositories/user');
const sequelize = require('../../../shared/configs/sequelize');

const organisationScopesQuery = `
SELECT
  o.id,
  ou.role_type AS roleType
FROM
  organisation_user ou
  JOIN organisations o ON (ou.organisation_id = o.id)
WHERE
      ou.user_id = :userId
  AND ou.deleted_at IS NULL
;
`;

const pickOrganisationScopesFields = R.pick([
  'id',
  'roleType',
]);

const networkScopesQuery = `
SELECT
  n.id,
  n.organisation_id AS organisationId,
  IF(ou.role_type = 'ADMIN', 'ADMIN', nu.role_type) AS roleType
FROM
  users u
  LEFT JOIN network_user nu ON (nu.user_id = u.id)
  LEFT JOIN organisation_user ou ON (ou.user_id = u.id)
  JOIN networks n ON (n.organisation_id = ou.organisation_id OR n.id = nu.network_id)
WHERE
  u.id = :userId
  AND (
       ou.role_type = 'ADMIN'
    OR (
          NOT nu.id IS NULL
      AND nu.deleted_at IS NULL
    )
  )
;
`;

const pickNetworkScopesFields = R.pick([
  'id',
  'organisationId',
  'roleType',
]);

const teamScopesQuery = `
SELECT
  t.id,
  t.network_id AS networkId
FROM
  teams t
  LEFT JOIN team_user tu ON (tu.team_id = t.id AND tu.user_id = :userId)
  JOIN networks n ON (t.network_id = n.id)
  LEFT JOIN network_user nu ON (nu.network_id = n.id AND nu.user_id = :userId)
  LEFT JOIN organisation_user ou ON (ou.organisation_id = n.organisation_id AND ou.user_id = :userId)
WHERE
    (
       ou.role_type = 'ADMIN'
    OR (
      nu.role_type = 'ADMIN'
      AND nu.deleted_at IS NULL
    )
    OR NOT tu.id IS NULL
  )
;
`;

const pickTeamScopesFields = R.pick([
  'id',
  'networkId',
]);

const arrayToObjectWithIdKey = (val) => R.mapObjIndexed(R.head, R.groupBy(R.prop('id'), val));

const executeQuery = (query, replacements) => {
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT, replacements });
};

async function getUserData(userId) {
  // TODO the user should be retrieved via the service
  const user = await userRepo.findUser(userId);
  if (!user) throw new Error('User not found!');

  const [organisationLinks, networkLinks, teamLinks] = await Promise.all([
    executeQuery(organisationScopesQuery, { userId })
      .then(R.map(pickOrganisationScopesFields))
      .then(arrayToObjectWithIdKey),
    executeQuery(networkScopesQuery, { userId })
      .then(R.map(pickNetworkScopesFields))
      .then(arrayToObjectWithIdKey),
    executeQuery(teamScopesQuery, { userId })
      .then(R.map(pickTeamScopesFields))
      .then(arrayToObjectWithIdKey),
  ]);

  return R.merge(user, {
    scopes: {
      organisations: organisationLinks,
      networks: networkLinks,
      teams: teamLinks,
    },
  });
}

exports.getUserData = getUserData;
