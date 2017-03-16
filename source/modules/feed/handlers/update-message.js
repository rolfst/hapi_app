const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const messageService = require('../services/message');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const updatedMessage = await messageService.update(payload, message);

    return reply({ data: responseUtil.toSnakeCase(updatedMessage) });
  } catch (err) {
    return reply(err);
  }
};
