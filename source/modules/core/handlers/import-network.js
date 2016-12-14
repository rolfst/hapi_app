import * as networkService from '../services/network';
import * as Logger from '../../../shared/services/logger';

const logger = Logger.getLogger('CORE/handler/importNetwork');

export default async (req, reply) => {
  try {
    const payload = { ...req.params, ...req.payload };
    const message = { ...req.pre, ...req.auth };

    logger.info('Importing network', { payload, message });
    networkService.importNetwork(payload, message);

    return reply().code(202);
  } catch (err) {
    return reply(err);
  }
};
