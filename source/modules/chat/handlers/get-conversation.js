import * as responseUtil from '../../../shared/utils/response';
import * as conversationService from '../services/conversation';
import * as Logger from '../../../shared/services/logger';

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
