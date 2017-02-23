import * as responseUtil from '../../../shared/utils/response';
import * as commentService from '../services/comment';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = {
      ...req.payload,
      messageId: req.params.messageId,
      userId: req.auth.credentials.id,
    };

    const likes = await commentService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(likes) });
  } catch (err) {
    return reply(err);
  }
};
