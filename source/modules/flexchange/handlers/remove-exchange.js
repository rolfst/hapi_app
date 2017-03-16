const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/removeExchanges');

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
