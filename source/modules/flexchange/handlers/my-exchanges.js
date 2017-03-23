const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/myExchanges');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.info('Listing my exchanges', { payload, message });
    const result = await flexchangeService.listPersonalizedExchanges(payload, message);

    return reply({ data: responseUtil.serialize(result) });
  } catch (err) {
    return reply(err);
  }
};
