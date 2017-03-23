const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/availableUsersForShift');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.info('Lising all available users for shift', { message, payload });
    const response = await flexchangeService.listAvailableUsersForShift(payload, message);

    return reply({ data: responseUtil.toSnakeCase(response) });
  } catch (err) {
    return reply(err);
  }
};
