import * as Logger from '../../../shared/services/logger';
import * as networkService from '../services/network';

const logger = Logger.getLogger('CORE/handler/networkAdmin');

export default async (req, reply) => {
  try {
    const payload = { ...req.params, ...req.payload };
    const message = { ...req.pre, ...req.auth };

    logger.info('Retrieving admins from network', { message, payload });
    const admins = await networkService.listAdminsFromNetwork(payload, message);

    return reply({ success: true, data: admins });
  } catch (err) {
    return reply(err);
  }
};
