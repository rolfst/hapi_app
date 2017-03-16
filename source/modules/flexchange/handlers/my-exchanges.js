const { pick } = require('lodash');
const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/myExchanges');

const FILTER_PROPERTIES = ['start', 'end'];

module.exports = async (req, reply) => {
  try {
    const filter = pick(req.query, FILTER_PROPERTIES);
    const message = { ...req.pre, ...req.auth };
    const payload = { filter, userId: req.auth.credentials.id };

    logger.info('Listing my exchanges', { payload, message });
    const result = await flexchangeService.listPersonalizedExchanges(payload, message);

    return reply({ data: responseUtil.serialize(result) });
  } catch (err) {
    return reply(err);
  }
};
