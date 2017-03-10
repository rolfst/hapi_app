import R from 'ramda';
import * as responseUtil from '../../../shared/utils/response';
import * as objectService from '../../core/services/object';
import * as feedService from '../services/feed';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const totalCountPromise = Promise.all([
      objectService.count({ parentType: 'network', parentId: req.params.networkId }, message),
      objectService.count({ parentType: 'user', parentId: message.credentials.id }, message),
    ]).then(R.sum);

    const feedPromise = feedService.makeForNetwork({
      ...req.query, networkId: req.params.networkId }, message);
    const [feedItems, count] = await Promise.all([feedPromise, totalCountPromise]);

    return reply({
      data: responseUtil.toSnakeCase(feedItems),
      meta: {
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total_count: count,
        },
      },
    });
  } catch (err) {
    return reply(err);
  }
};
