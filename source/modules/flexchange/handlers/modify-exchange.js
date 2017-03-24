const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtils = require('../../../shared/utils/response');
const flexchangeService = require('../services/flexchange');

const logger = require('../../../shared/services/logger')('FLEXCHANGE/handler/modifyExchange');

const services = {
  accept: flexchangeService.acceptExchange,
  decline: flexchangeService.declineExchange,
  approve: flexchangeService.approveExchange,
  reject: flexchangeService.rejectExchange,
};

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const actionHook = services[payload.action];

    logger.info('Updating exchange', { message, payload });
    const result = await actionHook(payload, message);

    return reply({ success: true, data: responseUtils.toSnakeCase(result) });
  } catch (err) {
    return reply(err);
  }
};
