import * as eventService from '../services/event';
import * as responseUtil from '../../../shared/utils/response';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.params, ...req.query };

    const stats = await eventService.getCreatedMessages(payload, message);

    return reply({ data: responseUtil.toSnakeCase(stats.payload) });
  } catch (err) {
    return reply(err);
  }
};
