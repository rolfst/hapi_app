import respondWithItem from 'common/utils/respond-with-item';
import { findConversationById, createConversation } from 'modules/chat/repositories/conversation';

module.exports = async (req, reply) => {
  const { type, users } = req.payload;
  users.push(req.auth.credentials.id);

  try {
    const createdConversation = await createConversation(type, req.auth.credentials.id, users);
    const conversation = await findConversationById(createdConversation.id);

    return reply(respondWithItem(conversation));
  } catch (err) {
    console.log('Error posting conversation:', err);
    return reply(err);
  }
};
