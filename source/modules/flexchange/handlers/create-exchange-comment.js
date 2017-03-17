const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/createExchangeComment');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.info('Creating exchange comment', { message, payload });
    const exchangeComment = await flexchangeService.createExchangeComment(payload, message);

    return reply({ success: true, data: responseUtil.serialize(exchangeComment) });
  } catch (err) {
    return reply(err);
  }
};
