const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');

const logger = Logger.createLogger('CORE/handler/viewNetwork');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };

    logger.info('Retrieving network information', { message });

    return reply({ data: responseUtil.toSnakeCase(req.pre.network) });
  } catch (err) {
    return reply(err);
  }
};
