import R from 'ramda';
import * as responseUtil from '../../../shared/utils/response';
import * as feedService from '../services/feed';
import * as objectService from '../services/object';

export default async (req, reply) => {
  try {
    const payload = { parentType: 'team', parentId: req.params.teamId };
    const message = { ...req.pre, ...req.auth };
    const [feedItems, count] = await Promise.all([
      feedService.make(payload, message),
      objectService.count({ where: R.pick(['parentType', 'parentId'], payload) }, message),
    ]);

    return reply({
      data: responseUtil.toSnakeCase(feedItems),
      meta: { pagination: { limit: payload.limit, offset: payload.offset, total_count: count } },
    });
  } catch (err) {
    return reply(err);
  }
};
