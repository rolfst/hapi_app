import * as responseUtil from '../../../shared/utils/response';
import * as commentService from '../services/comment';

export default async (req, reply) => {
  try {
    const payload = {
      messageId: req.params.messageId,
      userId: req.auth.credentials.id,
      ...req.payload,
    };
    const message = { ...req.pre, ...req.auth };

    const likes = await commentService.create(payload, message);

    return reply({
      data: responseUtil.toSnakeCase(likes),
    });
  } catch (err) {
    return reply(err);
  }
};
