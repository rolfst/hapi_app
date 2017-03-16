const { pick } = require('lodash');
const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/allExchangesForTeam');

const FILTER_PROPERTIES = ['start', 'end'];

module.exports = async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...pick(req.params, ['teamId']) };
    payload.filter = pick(req.query, FILTER_PROPERTIES);

    logger.info('Listing all exchanges for team', { payload, message });
    const exchanges = await flexchangeService.listExchangesForTeam(payload, message);

    return reply({ data: responseUtil.serialize(exchanges) });
  } catch (err) {
    return reply(err);
  }
};
