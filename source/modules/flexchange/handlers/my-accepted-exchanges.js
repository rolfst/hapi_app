const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const flexchangeService = require('../services/flexchange');

const logger = require('../../../shared/services/logger')('FLEXCHANGE/handler/myAcceptedExchanges');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.debug('Listing my accepted exchanges', { message, payload });
    const exchanges = await flexchangeService.listMyAcceptedExchanges(payload, message);

    return reply({ data: responseUtil.toSnakeCase(exchanges) });
  } catch (err) {
    return reply(err);
  }
};
