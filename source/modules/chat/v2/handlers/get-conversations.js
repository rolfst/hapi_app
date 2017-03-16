const responseUtil = require('../../../../shared/utils/response');
const conversationService = require('../services/conversation');

export default async (req, reply) => {
  try {
    const payload = { userId: req.auth.credentials.id, ...req.query };
    const message = { ...req.pre, ...req.auth };
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
