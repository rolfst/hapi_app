import * as responseUtil from '../../../../shared/utils/response';
import * as Logger from '../../../../shared/services/logger';
import * as conversationService from '../services/conversation';

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
