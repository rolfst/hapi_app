import R from 'ramda';
import * as responseUtil from '../../../shared/utils/response';
import * as objectService from '../../core/services/object';
import * as feedService from '../services/feed';

export default async (req, reply) => {
  try {
    const payload = { ...req.query, parentType: 'network', parentId: req.params.networkId };
    const message = { ...req.pre, ...req.auth };
    const [feedItems, count] = await Promise.all([
      feedService.make(payload, message),
      objectService.count({ where: [
        { parentType: 'user', parentId: message.credentials.id },
        R.pick(['parentType', 'parentId'], payload),
      ] }, message),
    ]);

    return reply({
      data: responseUtil.toSnakeCase(feedItems),
      meta: { pagination: { limit: payload.limit, offset: payload.offset, total_count: count } },
    });
  } catch (err) {
    return reply(err);
  }
};
