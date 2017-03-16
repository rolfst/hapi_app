const createServicePayload = require('../../../../shared/utils/create-service-payload');
const responseUtil = require('../../../../shared/utils/response');
const conversationService = require('../services/conversation');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    payload.userId = req.auth.credentials.id;

    const [conversations, count] = await Promise.all([
      conversationService.listConversationsForUser(payload, message),
      conversationService.countConversations(payload, message),
    ]);

    return reply({
      data: responseUtil.toSnakeCase(conversations),
      meta: { pagination: { limit: payload.limit, offset: payload.offset, total_count: count } },
    });
  } catch (err) {
    return reply(err);
  }
};
