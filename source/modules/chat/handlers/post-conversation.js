import * as responseUtil from '../../../shared/utils/response';
import * as conversationService from '../services/conversation';

module.exports = async (req, reply) => {
  try {
    const payload = { participants: req.payload.users, type: req.payload.type.toUpperCase() };
    const message = { ...req.auth, ...req.pre };
    const result = await conversationService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(result) });
  } catch (err) {
    console.log('Error creating conversation', err);
    return reply(err);
  }
};
