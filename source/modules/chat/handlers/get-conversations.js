import _ from 'lodash';
import { Message } from 'modules/chat/models';
import respondWithCollection from 'common/utils/respond-with-collection';
import parseIncludes from 'common/utils/parse-includes';
import { findAllForUser } from 'modules/chat/repositories/conversation';

module.exports = (req, reply) => {
  const includes = parseIncludes(req.query);

  const modelIncludes = [];

  if (_.includes(includes, 'messages')) {
    modelIncludes.push({ model: Message });
  }

  return findAllForUser(req.auth.credentials, modelIncludes)
    .then(conversations => reply(respondWithCollection(conversations)));
};
