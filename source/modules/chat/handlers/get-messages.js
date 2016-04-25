import Boom from 'boom';
import { Conversation } from 'modules/chat/models';
import respondWithCollection from 'common/utils/respond-with-collection';
import { findConversationById } from 'modules/chat/repositories/conversation';
import { findAllForConversation } from 'modules/chat/repositories/message';

module.exports = (req, reply) => {
  // TODO: implement ACL to check if user belongs to conversation
  // conversation.hasUser(req.auth.credentials.user)
  return findConversationById(req.params.id)
    .then(conversation => findAllForConversation(conversation))
    .then(messages => reply(respondWithCollection(messages)))
    .catch(boom => reply(boom));
};
