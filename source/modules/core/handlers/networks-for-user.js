const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const networkService = require('../services/network');

const logger = Logger.createLogger('CORE/handler/networksForUser');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { id: req.auth.credentials.id };

    logger.info('Retrieving networks for user', { message, payload });
    const data = await networkService.listNetworksForUser(payload, message);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    return reply(err);
  }
};
