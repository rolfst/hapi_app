const R = require('ramda');
const sequelize = require('../../../shared/configs/sequelize');
const logger = require('../../../shared/services/logger')('WORKFLOW/services/executor');
const queryGenerator = require('./query-generator');
const { CONCURRENT_USERS } = require('../definitions');

const executeQuery = (query) => {
  logger.info('executeQuery', { query });

  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
};

const pluckUserIds = R.pluck('userId');

const previewConditions = (organisationId, conditions) => {
  logger.info('previewConditions', { organisationId, conditions });

  const query = queryGenerator(organisationId, conditions, { count: true });

  return executeQuery(query)
    .then((result) => {
      if (!result || !result.length) throw new Error('No result!');

      return result[0];
    });
};

const fetchUnhandledUsersBatch = (workflow) => {
  logger.info('fetchUnhandledUsers', { workflow });

  const query = queryGenerator(
    workflow.organisationId,
    workflow.conditions,
    { workflowId: workflow.id, limit: CONCURRENT_USERS }
  );

  return executeQuery(query);
};

exports.executeQuery = executeQuery;
exports.fetchUnhandledUsersBatch = fetchUnhandledUsersBatch;
exports.pluckUserIds = pluckUserIds;
exports.previewConditions = previewConditions;
