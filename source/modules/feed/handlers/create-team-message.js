import R from 'ramda';
import * as messageService from '../services/message';
import * as responseUtil from '../../../shared/utils/response';

export default async (req, reply) => {
  try {
    const { poll_question: question, poll_options: options } = req.payload;
    const normalPayload = R.omit(['poll_question', 'poll_options'], req.payload);
    const defaultPayload = { parentType: 'team', parentId: req.params.teamId };

    const payload = R.mergeAll([defaultPayload, normalPayload, { question, pollOption }]);
    const message = { ...req.pre, ...req.auth };
    const feedItems = await messageService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(feedItems) });
  } catch (err) {
    return reply(err);
  }
};
