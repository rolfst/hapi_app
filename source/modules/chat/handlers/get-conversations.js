import * as responseUtil from 'shared/utils/response';
import * as conversationService from '../services/conversation';

module.exports = async (req, reply) => {
  try {
    const payload = { id: req.auth.credentials.id };
    const message = { ...req.pre, ...req.auth };
    const conversations = await conversationService.listConversationsForUser(payload, message);

    return reply({ data: responseUtil.toSnakeCase(conversations) });
  } catch (err) {
    console.log('Error listing conversations for user', err);
    return reply(err);
  }
};
