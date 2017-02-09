import * as Logger from '../../../shared/services/logger';
import * as networkService from '../services/network';

const logger = Logger.createLogger('CORE/handler/pristineNetworks');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };

    logger.info('Listing pristine networks', { message });
    const data = await networkService.listPristineNetworks(null, message);

    return reply({ data });
  } catch (err) {
    return reply(err);
  }
};
