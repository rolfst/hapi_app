import * as responseUtil from '../../../shared/utils/response';
import * as messageService from '../services/message';

export default async (req, reply) => {
  try {
    const payload = { ...req.params };
    const message = { ...req.pre, ...req.auth };

    const likes = await messageService.listLikes(payload, message);

    return reply({ data: responseUtil.toSnakeCase(likes) });
  } catch (err) {
    return reply(err);
  }
};
