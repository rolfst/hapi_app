const responseUtil = require('../../../shared/utils/response');
const attachmentService = require('../services/attachment');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.auth, fileStream: req.payload.file };
    const attachment = await attachmentService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(attachment) });
  } catch (err) {
    return reply(err);
  }
};
