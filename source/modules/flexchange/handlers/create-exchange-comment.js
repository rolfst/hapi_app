const { pick } = require('lodash');
const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/createExchangeComment');

const FILTER_PROPERTIES = ['start', 'end'];

module.exports = async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...pick(req.params, ['exchangeId']), ...pick(req.payload, ['text']) };
    payload.filter = pick(req.query, FILTER_PROPERTIES);

    logger.info('Creating exchange comment', { message, payload });
    const exchangeComment = await flexchangeService.createExchangeComment(payload, message);

    return reply({ success: true, data: responseUtil.serialize(exchangeComment) });
  } catch (err) {
    return reply(err);
  }
};
