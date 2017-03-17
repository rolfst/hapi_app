const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/exchangeActivityFeed');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.info('Listing exchange activity feed', { payload, message });
    const activities = await flexchangeService.listActivities(payload, message);

    return reply({ data: responseUtil.serialize(activities) });
  } catch (err) {
    return reply(err);
  }
};
