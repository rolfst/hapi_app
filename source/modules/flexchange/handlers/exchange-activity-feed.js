const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const flexchangeService = require('../services/flexchange');

const logger = require('../../../shared/services/logger')('FLEXCHANGE/handler/exchangeActivityFeed');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.debug('Listing exchange activity feed', { payload, message });
    const activities = await flexchangeService.listActivities(payload, message);

    return reply({ data: responseUtil.serialize(activities) });
  } catch (err) {
    return reply(err);
  }
};
