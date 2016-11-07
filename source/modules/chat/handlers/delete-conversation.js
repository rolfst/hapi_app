import { deleteConversationById } from '../repositories/conversation';
import * as Logger from '../../../shared/services/logger';

const logger = Logger.getLogger('CHAT/handler/deleteCoversation');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.params };

    // TODO move to service
    logger.info('Deleting conversation', { payload, message });
    await deleteConversationById(req.params.id);

    return reply({ success: true });
  } catch (err) {
    return reply(err);
  }
};
