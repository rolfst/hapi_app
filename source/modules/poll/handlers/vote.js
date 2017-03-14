import * as PollService from '../services/poll';
import * as responseUtil from '../../../shared/utils/response';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = {
      networkId: req.params.networkId,
      pollId: req.params.pollId,
      optionIds: req.payload.option_ids,
    };

    const poll = await PollService.vote(payload, message);

    return reply({ data: responseUtil.toSnakeCase(poll) });
  } catch (err) {
    return reply(err);
  }
};
