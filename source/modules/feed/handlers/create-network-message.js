import * as MessageService from '../services/message';
import * as responseUtil from '../../../shared/utils/response';

export default async (req, reply) => {
  try {
    const payload = { ...req.params, ...req.payload };
    const message = { ...req.pre, ...req.auth };
    const feedItems = await MessageService.createMessage(payload, message);

    return reply({ data: responseUtil.toSnakeCase(feedItems) });
  } catch (err) {
    return reply(err);
  }
};
