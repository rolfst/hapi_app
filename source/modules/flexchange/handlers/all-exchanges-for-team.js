const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/allExchangesForTeam');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.info('Listing all exchanges for team', { payload, message });
    const exchanges = await flexchangeService.listExchangesForTeam(payload, message);

    return reply({ data: responseUtil.serialize(exchanges) });
  } catch (err) {
    return reply(err);
  }
};
