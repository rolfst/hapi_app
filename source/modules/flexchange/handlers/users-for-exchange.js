const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/usersForExchange');

export default async (req, reply) => {
  try {
    const payload = { exchangeId: req.params.exchangeId };
    const message = { ...req.pre, ...req.auth };

    logger.info('Listing users for exchange', { payload, message });
    const result = await flexchangeService.listReceivers(payload, message);

    return reply({ data: responseUtil.toSnakeCase(result) });
  } catch (err) {
    return reply(err);
  }
};
