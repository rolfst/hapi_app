import * as messageService from '../services/message';
import * as responseUtil from '../../../shared/utils/response';

export default async (req, reply) => {
  try {
    const payload = { parentType: 'network', parentId: req.params.networkId, ...req.payload };
    const message = { ...req.pre, ...req.auth };
    const feedItems = await messageService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(feedItems) });
  } catch (err) {
    return reply(err);
  }
};
