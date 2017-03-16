const { pick } = require('lodash');
const Logger = require('../../../shared/services/logger');
const responseUtil = require('../../../shared/utils/response');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/myAcceptedExchanges');

module.exports = async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const FILTER_PROPERTIES = ['start', 'end'];
    const payload = { filter: pick(req.query, FILTER_PROPERTIES) };

    logger.info('Listing my accepted exchanges', { message, payload });
    const exchanges = await flexchangeService.listMyAcceptedExchanges(payload, message);

    return reply({ data: responseUtil.serialize(exchanges) });
  } catch (err) {
    return reply(err);
  }
};
