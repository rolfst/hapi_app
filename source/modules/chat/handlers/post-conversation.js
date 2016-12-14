import * as responseUtil from '../../../shared/utils/response';
import * as conversationService from '../services/conversation';
import * as Logger from '../../../shared/services/logger';

const logger = Logger.createLogger('CHAT/handler/postConversation');

module.exports = async (req, reply) => {
  try {
    const message = { ...req.auth, ...req.pre };
    const payload = { participants: req.payload.users, type: req.payload.type.toUpperCase() };

    logger.info('Post conversation', { payload, message });
    const result = await conversationService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(result) });
  } catch (err) {
    return reply(err);
  }
};
