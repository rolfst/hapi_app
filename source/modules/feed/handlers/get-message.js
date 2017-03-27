const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const messageService = require('../services/message');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    payload.include = req.query.include ? req.query.include.split(',') : [];
    const likes = await messageService.getAsObject(payload, message);

    return reply({ data: responseUtil.toSnakeCase(likes) });
  } catch (err) {
    return reply(err);
  }
};
