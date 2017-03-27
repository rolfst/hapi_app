const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const flexchangeService = require('../services/flexchange');

const logger = require('../../../shared/services/logger')('FLEXCHANGE/handler/allExchangesForTeam');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.debug('Listing all exchanges for team', { payload, message });
    const exchanges = await flexchangeService.listExchangesForTeam(payload, message);

    return reply({ data: responseUtil.serialize(exchanges) });
  } catch (err) {
    return reply(err);
  }
};
