const createServicePayload = require('../../../../shared/utils/create-service-payload');
const responseUtil = require('../../../../shared/utils/response');
const conversationService = require('../services/conversation');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    payload.id = req.auth.credentials.id;

    const conversations = await conversationService.listConversationsForUser(payload, message);

    return reply({ data: responseUtil.toSnakeCase(conversations) });
  } catch (err) {
    return reply(err);
  }
};
