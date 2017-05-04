const R = require('ramda');
const logger = require('../../../shared/services/logger')('WORKFLOW/service/processor');

const baseQuery = `
SELECT
  ou.user_id
FROM
  organisation_user ou
  %joins
WHERE
  ou.organisation_id = :organisation_id
  %where
GROUP BY
  ou.user_id
`;

const structure = {
  user: {
    identifier: 'u',
    joinSQL: 'LEFT JOIN user u ON u.id = ou.user_id',
    fields: [
      'id',
      'username',
      'date_of_birth',
      'first_name',
      'last_name',
      'created_at',
      'updated_at',
    ],
  },
  organisation_user: {
    identifier: 'ou',
    fields: [
      'id',
      'role_type',
      'last_active',
      'created_at',
      'updated_at',
      'invited_at',
      'deleted_at',
    ],
  },
  network_user: {
    identifier: 'nu',
    depends: [
      'network',
    ],
    joinSQL: 'LEFT JOIN network_user nu ON (ou.user_id = nu.user_id AND n.organisation_id = ou.organisation_id)',
    fields: [
      'id',
      'role_type',
      'last_active',
      'invited_at',
      'deleted_at',
    ],
  },
  network: {
    identifier: 'n',
    depends: [
      'network_user',
    ],
    joinSQL: 'LEFT JOIN network n ON (n.organisation_id = ou.organisation_id AND ou.user_id = nu.user_id)',
    fields: [
      'id',
      'name',
    ],
  },
};

/*
 *  Precompile some things
 */
const selectables = {};

// Get all selectable fields and precompile some info
R.mapObjIndexed((table, tableName) => {
  R.mapObjIndexed((field, fieldName) => {
    selectables[`${tableName}.${fieldName}`] = {
      join: tableName,
      identifier: `${table.identifier}.${fieldName}`,
    };
  });
});

const buildQuery = (organisationId, conditions) => {
  logger.info('buildQuery', { organisationId, conditions });

  const joins = [];
  const addJoin = (name) => {
    if (joins.includes(name)) return;

    if (!structure.hasOwnProperty(name)) throw new Error('invalid join');

    if (structure[name].hasOwnProperty('depends')) {
      structure[name].depends.forEach(addJoin);
    }

    joins.push(name);
  };

  const whereConditions = [];
  const params = {
    organisation_id: organisationId,
  };

  // TODO - build where conditions

  const buildJoins = R.filter(R.identity(), R.map((table) => {
    if (structure[table].hasOwnProperty('joinSQL')) {
      return structure[table].joinSQL;
    }

    return null;
  }), joins);

  return {
    query: baseQuery
      .replace('%joins', buildJoins.join(' '))
      .replace('%where', whereConditions.join(' AND ')),
    params,
  }
};

exports.buildQuery = buildQuery;

