const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/availableUsersForShift');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.params, ...req.query };

    logger.info('Lising all available users for shift', { message, payload });
    const response = await flexchangeService.listAvailableUsersForShift(payload, message);

    return reply({ data: responseUtil.toSnakeCase(response) });
  } catch (err) {
    return reply(err);
  }
};
