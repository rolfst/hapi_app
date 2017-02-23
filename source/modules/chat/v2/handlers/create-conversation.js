import * as responseUtil from '../../../../shared/utils/response';
import * as conversationService from '../services/conversation';

module.exports = async (req, reply) => {
  try {
    const payload = { ...req.params, ...req.payload };
    const message = { ...req.pre, ...req.auth };
    const result = await conversationService.create(payload, message);

    result.isNew = !!result.new;

    return reply({ data: responseUtil.toSnakeCase(result) });
  } catch (err) {
    return reply(err);
  }
};
