import * as responseUtil from '../../../shared/utils/response';
import * as Logger from '../../../shared/services/logger';
import * as flexchangeService from '../services/flexchange';

const logger = Logger.createLogger('FLEXCHANGE/handler/viewExchanges');

export default async (req, reply) => {
  try {
    const payload = { exchangeId: req.params.exchangeId };
    const message = { ...req.pre, ...req.auth };

    logger.info('Viewing exchange', { payload, message });
    const result = await flexchangeService.getExchange(payload, message);

    return reply({ data: responseUtil.serialize(result) });
  } catch (err) {
    return reply(err);
  }
};
