import * as Logger from '../../../shared/services/logger';
import * as flexchangeService from '../services/flexchange';

const logger = Logger.getLogger('FLEXCHANGE/handler/removeExchanges');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { exchangeId: req.params.exchangeId };

    logger.info('Deleting exchange', { payload, message });
    await flexchangeService.deleteExchange(payload);

    return reply({ success: true });
  } catch (err) {
    return reply(err);
  }
};
