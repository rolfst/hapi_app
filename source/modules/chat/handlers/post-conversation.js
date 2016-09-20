import * as responseUtil from 'shared/utils/response';
import { findConversationById, createConversation } from 'modules/chat/repositories/conversation';

module.exports = async (req, reply) => {
  const { type, users } = req.payload;
  users.push(req.auth.credentials.id);

  try {
    const createdConversation = await createConversation(type, req.auth.credentials.id, users);
    const conversation = await findConversationById(createdConversation.id);

    return reply({ data: responseUtil.serialize(conversation) });
  } catch (err) {
    return reply(err);
  }
};
