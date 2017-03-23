const createServicePayload = require('../../../../shared/utils/create-service-payload');
const responseUtil = require('../../../../shared/utils/response');
const conversationService = require('../services/conversation');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const result = await conversationService.createMessage(payload, message);

    return reply({ data: responseUtil.toSnakeCase(result) });
  } catch (err) {
    return reply(err);
  }
};
