const Logger = require('../../../../shared/services/logger');
const responseUtil = require('../../../../shared/utils/response');
const conversationService = require('../services/conversation');

const logger = Logger.createLogger('CHAT/handler/getConversation');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.params };

    logger.info('Get conversation', { payload, message });
    const result = await conversationService.getConversation(payload, message);

    return reply({ data: responseUtil.toSnakeCase(result) });
  } catch (err) {
    return reply(err);
  }
};
