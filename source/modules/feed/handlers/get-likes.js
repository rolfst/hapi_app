const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const messageService = require('../services/message');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const likes = await messageService.listLikes(payload, message);

    return reply({ data: responseUtil.toSnakeCase(likes) });
  } catch (err) {
    return reply(err);
  }
};
