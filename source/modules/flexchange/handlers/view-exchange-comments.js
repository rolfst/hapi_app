const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/viewExchangeComments');

module.exports = async (req, reply) => {
  try {
    const payload = { exchangeId: req.params.exchangeId };
    const message = { ...req.pre, ...req.auth };

    logger.info('Getting exchange comments', { payload, message });
    const result = await flexchangeService.listComments(payload, message);

    return reply({ data: responseUtil.serialize(result) });
  } catch (err) {
    return reply(err);
  }
};
