const sequelize = require('../../../shared/configs/sequelize');
const logger = require('../../../shared/services/logger')('WORKFLOW/services/executor');
const queryGenerator = require('./query-generator');

const executeQuery = (query) => {
  logger.info('executeQuery', { query });

  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
};

const previewConditions = (organisationId, conditions) => {
  logger.info('previewConditions', { organisationId, conditions });

  const query = queryGenerator(organisationId, conditions, { count: true });

  return executeQuery(query)
    .then((result) => {
      if (!result || !result.length) throw new Error('No result!');

      return result[0];
    });
};

exports.previewConditions = previewConditions;
