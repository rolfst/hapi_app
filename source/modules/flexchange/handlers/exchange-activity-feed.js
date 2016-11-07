import * as responseUtil from '../../../shared/utils/response';
import * as Logger from '../../../shared/services/logger';
import * as flexchangeService from '../services/flexchange';

const logger = Logger.getLogger('FLEXCHANGE/handler/exchangeActivityFeed');

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
