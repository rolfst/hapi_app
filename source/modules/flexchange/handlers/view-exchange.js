const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/viewExchanges');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.info('Viewing exchange', { payload, message });
    const result = await flexchangeService.getExchange(payload, message);

    return reply({ data: responseUtil.serialize(result) });
  } catch (err) {
    console.log(err)
    return reply(err);
  }
};
