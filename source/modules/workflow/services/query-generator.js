const R = require('ramda');
const sequelize = require('../../../shared/configs/sequelize');
const { EConditionOperators } = require('../definitions');
const logger = require('../../../shared/services/logger')('WORKFLOW/services/query-generator');

const escape = (val) => sequelize.escape(val);
const castToArrayAndEscape = R.map(escape, R.split(','));

const selector = 'ou.user_id';

const groupBy = 'ou.user_id';

const baseQuery = `
SELECT
  %selector
FROM
  organisation_user ou
  %joins
WHERE
  %where
%groupBy
%orderBy
%limit
`;

/*
 *  structure of tables
 *
 *  {
 *    [virtual table name]: {
 *      identifier: [identifier used in sql statement],
 *      joinSQL: [sql to inject when using this join],
 *      fields: [array of fields available in table],
 *      calculatedFields: {
 *        property: 'sql to calculate this property'
 *      },
 *      depends: [array of virtual table names on which this join depends],
 *    }
 *  }
 */
const structure = {
  user: {
    identifier: 'u',
    joinSQL: 'JOIN users u ON u.id = ou.user_id',
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
      full_name: 'CONCAT_WS(\' \', u.first_name, u.last_name)',
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
    joinSQL: 'JOIN networks n ON n.organisation_id = ou.organisation_id\n  JOIN network_user nu ON (nu.network_id = n.id AND ou.user_id = nu.user_id)',
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
  team_user: {
    identifier: 't',
    joinSQL: 'JOIN teams t ON (t.network_id = n.id)\n  JOIN team_user tu ON (tu.team_id = t.id AND tu.user_id = ou.user_id)',
    depends: [
      'network',
      'team',
    ],
    fields: [
      'id',
    ],
  },
  team: {
    identifier: 't',
    depends: [
      'team_user',
    ],
    fields: [
      'id',
      'name',
    ],
  },
};

const actionDoneJoin = 'LEFT JOIN workflow_actionsdone wad ON (wad.workflow_id = %workflowId AND wad.user_id = ou.user_id)';

const actionDoneWhere = 'wad.id IS NULL';

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
    R.forEachObjIndexed((select, fieldName) => {
      selectables[`${tableName}.${fieldName}`] = {
        join: tableName,
        identifier: `${select}`,
      };
    }, table.calculatedFields);
  }
}, structure);

const buildQuery = (organisationId, conditions = null, {
  count,
  limit,
  offset,
  orderBy,
  workflowId,
} = {}) => {
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

  const whereConditions = [`ou.organisation_id = ${sequelize.escape(organisationId)}`];

  // if workflow id was supplied, we have to ignore users in actions_done
  if (workflowId) {
    whereConditions.push(actionDoneWhere);
  }

  if (conditions) {
    R.forEach((condition) => {
      if (!Object.prototype.hasOwnProperty.call(selectables, condition.field)) throw new Error('Unknown field');

      addJoin(selectables[condition.field].join);

      const fieldName = selectables[condition.field].identifier;
      let operator;
      let escapedValue;

      switch (condition.operator) {
        case EConditionOperators.EQUAL:
          operator = '=';
          escapedValue = escape(condition.value);
          break;

        case EConditionOperators.GREATER_THAN:
        case EConditionOperators.LESS_THAN:
        case EConditionOperators.GREATER_THAN_OR_EQUAL:
        case EConditionOperators.LESS_THAN_OR_EQUAL:
        case EConditionOperators.NOT:
          operator = condition.operator;
          escapedValue = escape(condition.value);
          break;

        case EConditionOperators.IN:
          operator = 'IN';
          escapedValue = `(${castToArrayAndEscape(condition.value)})`;
          break;

        case EConditionOperators.NOT_IN:
          operator = 'NOT IN';
          escapedValue = `(${castToArrayAndEscape(condition.value)})`;
          break;

        case EConditionOperators.CONTAINS:
          operator = 'LIKE';
          escapedValue = escape(`%${condition.value}%`);
          break;

        default:
          throw new Error('Invalid operator');
      }

      whereConditions.push(`${fieldName} ${operator} ${escapedValue}`);
    }, conditions);
  }

  const buildJoins = () => {
    const joinStatements = R.filter(R.identity(), R.map((table) => {
      if (Object.prototype.hasOwnProperty.call(structure[table], 'joinSQL')) {
        return structure[table].joinSQL;
      }

      return null;
    }, joins));

    // if workflow id was supplied, we have to ignore users in actions_done
    if (workflowId) {
      joinStatements.push(actionDoneJoin.replace('%workflowId', workflowId));
    }

    return joinStatements;
  };

  const selectorStatement = count ? `COUNT(DISTINCT ${selector}) count` : `${selector} userId`;
  const groupByStatement = count ? '' : `GROUP BY\n  ${groupBy}\n`;
  const limitStatement = limit || offset ? `LIMIT ${offset || 0}, ${limit || 50}\n` : '';
  const orderByStatement = orderBy ? `ORDER BY ${orderBy}\n` : '';

  return baseQuery
    .replace('%selector', selectorStatement)
    .replace('%groupBy\n', groupByStatement)
    .replace('%joins', buildJoins().join('\n  '))
    .replace('%where', whereConditions.join('\n  AND '))
    .replace('%limit\n', limitStatement)
    .replace('%orderBy\n', orderByStatement);
};

module.exports = buildQuery;
