const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/exchangeActivityFeed');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.params, ...req.query };

    logger.info('Listing exchange activity feed', { payload, message });
    const activities = await flexchangeService.listActivities(payload, message);

    return reply({ data: responseUtil.serialize(activities) });
  } catch (err) {
    return reply(err);
  }
};
