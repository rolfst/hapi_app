import * as responseUtil from '../../../shared/utils/response';
import * as messageService from '../services/message';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = {
      ...req.params,
      include: req.query.include ? req.query.include.split(',') : [],
    };
    const likes = await messageService.getAsObject(payload, message);

    return reply({ data: responseUtil.toSnakeCase(likes) });
  } catch (err) {
    return reply(err);
  }
};
