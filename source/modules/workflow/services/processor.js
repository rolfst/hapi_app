const R = require('ramda');

const baseQuery = `
SELECT
  ou.user_id
FROM
  organisation_user ou
  %joins
WHERE
  ou.organisation_id = :organisation_id
  %where
`;

const structure = {
  user: {
    identifier: 'u',
    joinSQL: 'LEFT JOIN user u ON u.id = ou.user_id',
    fields: [
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
      'role_type',
      'created_at',
      'updated_at',
      'invited_at',
      'deleted_at',
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
  console.log('buildQuery', organisationId, conditions);
};

exports.buildQuery = buildQuery;

