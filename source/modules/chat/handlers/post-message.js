import * as responseUtil from '../../../shared/utils/response';
import * as conversationService from '../services/conversation';

module.exports = async (req, reply) => {
  try {
    const payload = { ...req.params, ...req.payload };
    const message = { ...req.pre, ...req.auth };
    const result = await conversationService.createMessage(payload, message);

    return reply({ data: responseUtil.serialize(result) });
  } catch (err) {
    console.log('Error creating message for conversation', err);
    return reply(err);
  }
};
