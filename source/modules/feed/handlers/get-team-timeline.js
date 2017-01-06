import * as ObjectService from '../services/object';
import * as responseUtil from '../../../shared/utils/response';

export default async (req, reply) => {
  try {
    const payload = { parentType: 'team', parentId: req.params.networkId };
    const message = { ...req.pre, ...req.auth };
    const feedItems = await ObjectService.listObjects(payload, message);

    return reply({ data: responseUtil.toSnakeCase(feedItems) });
  } catch (err) {
    return reply(err);
  }
};
