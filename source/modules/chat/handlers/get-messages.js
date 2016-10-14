import * as responseUtil from '../../../shared/utils/response';
import * as conversationService from '../services/conversation';

export default async (req, reply) => {
  try {
    const payload = { ...req.params };
    const message = { ...req.pre, ...req.auth };
    const result = await conversationService.listMessages(payload, message);

    return reply({ data: responseUtil.toSnakeCase(result) });
  } catch (err) {
    console.log('Error retrieving messages for conversation', err);
    return reply(err);
  }
};
