const R = require('ramda');
const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');

const logger = Logger.createLogger('CORE/handler/viewNetwork');

module.exports = async (req, reply) => {
  try {
    const message = R.merge(req.pre, req.auth);

    logger.info('Retrieving network information', { message });

    return reply({ data: responseUtil.toSnakeCase(req.pre.network) });
  } catch (err) {
    return reply(err);
  }
};
