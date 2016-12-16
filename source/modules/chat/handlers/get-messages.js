import * as responseUtil from '../../../shared/utils/response';
import * as Logger from '../../../shared/services/logger';
import * as conversationService from '../services/conversation';

const logger = Logger.createLogger('CHAT/handler/getMessages');

export default async (req, reply) => {
  try {
    const payload = { ...req.params };
    const message = { ...req.pre, ...req.auth };

    logger.info('retrieving messages for conversation', { message, payload });
    const result = await conversationService.listMessages(payload, message);

    return reply({ data: responseUtil.toSnakeCase(result) });
  } catch (err) {
    return reply(err);
  }
};
