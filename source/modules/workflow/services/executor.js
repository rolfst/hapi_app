const R = require('ramda');
const sequelize = require('../../../shared/configs/sequelize');
const logger = require('../../../shared/services/logger')('WORKFLOW/services/executor');
const queryGenerator = require('./query-generator');
const { CONCURRENT_USERS } = require('../definitions');

const executeQuery = (query, replacements) => {
  logger.debug('executeQuery', { query });

  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT, replacements });
};

const pluckUserIds = R.pluck('userId');
const pluckIds = R.pluck('id');

/**
 * Get a reach count for the conditions provided
 * @param {number} organisationId
 * @param {Array<WorkflowConditions>} conditions
 * @method previewConditions
 * @returns {Promise.<{ count }>}
 */
const previewConditions = (organisationId, conditions) => {
  logger.info('previewConditions', { organisationId, conditions });

  const query = queryGenerator(organisationId, conditions, { count: true });

  return executeQuery(query)
    .then((result) => {
      if (!result || !result.length) throw new Error('No result!');

      return result[0];
    });
};

/**
 * Fetch the next batch of users that not have been under action for a particular workflow
 * @param {Workflow} workflow
 * @returns {Promise.<Array<{number} userIds>>}
 */
const fetchUnhandledUsersBatch = (workflow) => {
  logger.info('fetchUnhandledUsers', { workflow });

  const query = queryGenerator(
    workflow.organisationId,
    workflow.conditions,
    { workflowId: workflow.id, limit: CONCURRENT_USERS }
  );

  return executeQuery(query)
    .then(pluckUserIds);
};

exports.executeQuery = executeQuery;
exports.fetchUnhandledUsersBatch = fetchUnhandledUsersBatch;
exports.pluckIds = pluckIds;
exports.pluckUserIds = pluckUserIds;
exports.previewConditions = previewConditions;
