import { check } from 'hapi-acl-plugin';
import respondWithCollection from 'common/utils/respond-with-collection';
import { findConversationById } from 'modules/chat/repositories/conversation';
import { findAllForConversation } from 'modules/chat/repositories/message';

module.exports = async (req, reply) => {
  try {
    const { credentials } = req.auth;
    const modelIncludes = [];
    const conversation = await findConversationById(req.params.id, modelIncludes);

    check(credentials, 'get-conversation', conversation, 'You\'re not part of this conversation');

    const messages = await findAllForConversation(conversation);

    return reply(respondWithCollection(messages));
  } catch (err) {
    reply(err);
  }
};
