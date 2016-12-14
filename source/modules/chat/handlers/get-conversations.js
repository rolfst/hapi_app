import * as conversationService from '../services/conversation';
import * as responseUtil from '../../../shared/utils/response';
import * as Logger from '../../../shared/services/logger';

const logger = Logger.createLogger('CHAT/handler/deleteCoversation');

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
