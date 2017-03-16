const responseUtil = require('../../../shared/utils/response');
const messageService = require('../services/message');

export default async (req, reply) => {
  try {
    const payload = { ...req.params, include: req.query.include.split(',') };
    const message = { ...req.pre, ...req.auth };
    const likes = await messageService.getAsObject(payload, message);

    return reply({ data: responseUtil.toSnakeCase(likes) });
  } catch (err) {
    return reply(err);
  }
};
