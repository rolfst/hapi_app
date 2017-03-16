const Logger = require('../../../../shared/services/logger');
const createServicePayload = require('../../../../shared/utils/create-service-payload');
const { deleteConversationById } = require('../repositories/conversation');

const logger = Logger.createLogger('CHAT/handler/deleteCoversation');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    // TODO move to service
    logger.info('Deleting conversation', { payload, message });
    await deleteConversationById(req.params.id);

    return reply({ success: true });
  } catch (err) {
    return reply(err);
  }
};
