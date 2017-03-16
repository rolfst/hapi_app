const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/viewExchanges');

module.exports = async (req, reply) => {
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
