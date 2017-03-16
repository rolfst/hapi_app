const { pick } = require('lodash');
const Logger = require('../../../shared/services/logger');
const responseUtils = require('../../../shared/utils/response');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/modifyExchange');

const services = {
  accept: flexchangeService.acceptExchange,
  decline: flexchangeService.declineExchange,
  approve: flexchangeService.approveExchange,
  reject: flexchangeService.rejectExchange,
};

module.exports = async (req, reply) => {
  try {
    const params = pick(req.params, ['exchangeId']);
    const payload = {
      ...params,
      action: req.payload.action,
      userId: req.payload.user_id,
    };

    const actionHook = services[payload.action];
    const message = { ...req.pre, ...req.auth };

    logger.info('Updating exchange', { message, payload });
    const result = await actionHook(payload, message);

    return reply({ success: true, data: responseUtils.toSnakeCase(result) });
  } catch (err) {
    return reply(err);
  }
};
