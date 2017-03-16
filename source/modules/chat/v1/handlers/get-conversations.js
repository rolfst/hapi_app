const Logger = require('../../../../shared/services/logger');
const responseUtil = require('../../../../shared/utils/response');
const conversationService = require('../services/conversation');

const logger = Logger.createLogger('CHAT/handler/getConversations');

module.exports = async (req, reply) => {
  try {
    const payload = { id: req.auth.credentials.id };
    const message = { ...req.pre, ...req.auth };
    logger.info('Listing conversations for user', { message, payload });
    const conversations = await conversationService.listConversationsForUser(payload, message);

    return reply({ data: responseUtil.toSnakeCase(conversations) });
  } catch (err) {
    return reply(err);
  }
};
