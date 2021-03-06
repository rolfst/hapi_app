const createServicePayload = require('../../../../shared/utils/create-service-payload');
const responseUtil = require('../../../../shared/utils/response');
const conversationService = require('../services/conversation');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const [result, count] = await Promise.all([
      conversationService.listMessages(payload, message),
      conversationService.countMessages(payload, message),
    ]);

    return reply({
      data: responseUtil.toSnakeCase(result),
      meta: { pagination: { limit: payload.limit, offset: payload.offset, total_count: count } },
    });
  } catch (err) {
    return reply(err);
  }
};
