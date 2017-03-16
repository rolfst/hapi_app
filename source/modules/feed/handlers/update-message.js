const messageService = require('../services/message');
const responseUtil = require('../../../shared/utils/response');

export default async (req, reply) => {
  try {
    const payload = { ...req.payload, ...req.params };
    const message = { ...req.pre, ...req.auth };
    const updatedMessage = await messageService.update(payload, message);

    return reply({ data: responseUtil.toSnakeCase(updatedMessage) });
  } catch (err) {
    return reply(err);
  }
};
