import * as feedService from '../services/feed';
import * as responseUtil from '../../../shared/utils/response';

export default async (req, reply) => {
  try {
    const payload = { parentType: 'team', parentId: req.params.teamId };
    const message = { ...req.pre, ...req.auth };
    const feedItems = await feedService.make(payload, message);

    return reply({ data: responseUtil.toSnakeCase(feedItems) });
  } catch (err) {
    return reply(err);
  }
};
