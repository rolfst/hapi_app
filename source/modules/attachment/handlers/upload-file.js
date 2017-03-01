import * as responseUtil from '../../../shared/utils/response';
import * as attachmentService from '../services/attachment';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.auth, fileStream: req.payload.file };
    const likes = await attachmentService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(likes) });
  } catch (err) {
    return reply(err);
  }
};
