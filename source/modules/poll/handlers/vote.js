import * as PollService from '../services/poll';
import * as responseUtil from '../../../shared/utils/response';

export default async (req, reply) => {
  try {
    const payload = { ...req.params };
    const message = { ...req.pre, ...req.auth };
    const feedItems = await PollService.vote(payload, message);

    return reply({ data: responseUtil.toSnakeCase(feedItems) });
  } catch (err) {
    return reply(err);
  }
};
