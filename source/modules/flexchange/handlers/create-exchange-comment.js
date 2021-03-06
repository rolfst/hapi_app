const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const flexchangeService = require('../services/flexchange');

const logger = require('../../../shared/services/logger')('FLEXCHANGE/handler/createExchangeComment');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.debug('Creating exchange comment', { message, payload });
    const exchangeComment = await flexchangeService.createExchangeComment(payload, message);

    return reply({ success: true, data: responseUtil.toSnakeCase(exchangeComment) });
  } catch (err) {
    return reply(err);
  }
};
