import R from 'ramda';
import * as responseUtil from '../../../../shared/utils/response';
import * as conversationService from '../services/conversation';

module.exports = async (req, reply) => {
  try {
    const payload = { ...req.params, ...req.payload };
    const message = { ...req.pre, ...req.auth };
    const result = await conversationService.create(payload, message);

    return reply({
      data: responseUtil.toSnakeCase(R.omit(['new'], result)),
      is_new: !!result.new,
    });
  } catch (err) {
    return reply(err);
  }
};
