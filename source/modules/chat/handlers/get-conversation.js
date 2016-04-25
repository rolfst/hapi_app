import _ from 'lodash';
import { Message } from 'modules/chat/models';
import { findConversationById } from 'modules/chat/repositories/conversation';
import respondWithItem from 'common/utils/respond-with-item';
import parseIncludes from 'common/utils/parse-includes';

module.exports = (req, reply) => {
  const includes = parseIncludes(req.query);

  const modelIncludes = [];

  if (_.includes(includes, 'messages')) {
    modelIncludes.push({ model: Message });
  }

  // TODO: implement ACL to check if user belongs to conversation
  // conversation.hasUser(req.auth.credentials.user)
  findConversationById(req.params.id, modelIncludes)
    .then(conversation => reply(respondWithItem(conversation)))
    .catch(boom => reply(boom));
};
