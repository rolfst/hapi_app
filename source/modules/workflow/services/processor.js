const R = require('ramda');
const sequelize = require('../../../shared/configs/sequelize');
const { EConditionOperators } = require('../definitions');
const logger = require('../../../shared/services/logger')('WORKFLOW/service/processor');

const baseQuery = `
SELECT
  ou.user_id
FROM
  organisation_user ou
  %joins
WHERE
  ou.organisation_id = %organisation_id
  %where
GROUP BY
  ou.user_id
`;

const structure = {
  user: {
    identifier: 'u',
    joinSQL: 'LEFT JOIN users u ON u.id = ou.user_id',
    fields: [
      'id',
      'username',
      'date_of_birth',
      'first_name',
      'last_name',
      'created_at',
      'updated_at',
    ],
    calculatedFields: {
      age: 'TIMESTAMPDIFF(YEAR, u.date_of_birth, CURDATE())',
    },
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
    // The join for network is also here because otherwise it would create a cyclic dependency
    joinSQL: 'LEFT JOIN networks n ON n.organisation_id = ou.organisation_id\n  LEFT JOIN network_user nu ON (nu.network_id = n.id AND ou.user_id = nu.user_id)',
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
    joinSQL: '',
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
R.forEachObjIndexed((table, tableName) => {
  R.forEach((fieldName) => {
    selectables[`${tableName}.${fieldName}`] = {
      join: tableName,
      identifier: `${table.identifier}.${fieldName}`,
    };
  }, table.fields);

  if (table.calculatedFields) {
    R.forEachObjIndexed((selector, fieldName) => {
      selectables[`${tableName}.${fieldName}`] = {
        join: tableName,
        identifier: `${selector}`,
      };
    }, table.calculatedFields);
  }
}, structure);

const castToArrayAndEscape = R.map(sequelize.escape, R.split(','));

const buildQuery = (organisationId, conditions) => {
  logger.info('buildQuery', { organisationId, conditions });

  if (!organisationId) {
    throw new Error('No organisation id supplied!');
  }

  const joins = [];
  const addJoin = (name, skipDependency) => {
    if (joins.includes(name)) return;

    if (!Object.prototype.hasOwnProperty.call(structure, name)) throw new Error('invalid join');

    if (Object.prototype.hasOwnProperty.call(structure[name], 'depends')) {
      R.forEach((depName) => {
        // The second parameter to addJoin prevents cyclic dependencies
        if (depName !== skipDependency) addJoin(depName, name);
      }, structure[name].depends);
    }

    joins.push(name);
  };

  let whereConditions = [];

  if (conditions) {
    whereConditions = conditions.map((condition) => {
      if (!Object.prototype.hasOwnProperty.call(selectables, condition.field)) throw new Error('Unknown field');

      addJoin(selectables[condition.field].join);

      const fieldName = selectables[condition.field].identifier;
      let operator;
      let escapedValue;

      switch (condition.operator) {
        case EConditionOperators.EQUAL:
        case EConditionOperators.GREATER_THAN:
        case EConditionOperators.LESS_THAN:
        case EConditionOperators.GREATER_THAN_OR_EQUAL:
        case EConditionOperators.LESS_THAN_OR_EQUAL:
        case EConditionOperators.NOT:
          operator = condition.operator;
          escapedValue = sequelize.escape(condition.value);
          break;

        case EConditionOperators.CONTAINS:
          operator = 'IN';
          escapedValue = `(${castToArrayAndEscape(condition.value)})`;
          break;

        case EConditionOperators.DOESNTCONTAIN:
          operator = 'NOT IN';
          escapedValue = `(${castToArrayAndEscape(condition.value)})`;
          break;

        default:
          throw new Error('Invalid operator');
      }

      return `${fieldName} ${operator} ${escapedValue}`;
    });
  }

  const buildJoins = R.filter(R.identity(), R.map((table) => {
    if (Object.prototype.hasOwnProperty.call(structure[table], 'joinSQL')) {
      return structure[table].joinSQL;
    }

    return null;
  }, joins));

  return baseQuery
    .replace('%joins', buildJoins.join('\n  '))
    .replace('%where', whereConditions.join(' AND '))
    .replace('%organisation_id', sequelize.escape(organisationId));
};

exports.buildQuery = buildQuery;
