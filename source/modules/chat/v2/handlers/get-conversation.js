import * as responseUtil from '../../../../shared/utils/response';
import * as conversationService from '../services/conversation';

export default async (req, reply) => {
  try {
    const { conversationId } = req.params;
    const message = { ...req.pre, ...req.auth };

    const conversation = await conversationService.getConversation(conversationId, message);

    return reply({ data: responseUtil.toSnakeCase(conversation) });
  } catch (err) {
    return reply(err);
  }
};
