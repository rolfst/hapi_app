const responseUtil = require('../../../../shared/utils/response');
const Logger = require('../../../../shared/services/logger');
const conversationService = require('../services/conversation');

const logger = Logger.createLogger('CHAT/handler/postMessage');

module.exports = async (req, reply) => {
  try {
    const payload = { ...req.params, ...req.payload };
    const message = { ...req.pre, ...req.auth };

    logger.info('Creating message for conversation', { message, payload });
    const result = await conversationService.createMessage(payload, message);

    return reply({ data: responseUtil.toSnakeCase(result) });
  } catch (err) {
    return reply(err);
  }
};
