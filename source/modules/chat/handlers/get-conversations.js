import { includes } from 'lodash';
import respondWithCollection from 'common/utils/respond-with-collection';
import parseIncludes from 'common/utils/parse-includes';
import { Message } from 'modules/chat/models';
import { findAllForUser } from 'modules/chat/repositories/conversation';

module.exports = async (req, reply) => {
  const queryIncludes = parseIncludes(req.query);
  const modelIncludes = [];

  if (includes(queryIncludes, 'messages')) {
    modelIncludes.push({ model: Message });
  }

  try {
    const conversations = await findAllForUser(req.auth.credentials, modelIncludes);

    return reply(respondWithCollection(conversations));
  } catch (err) {
    return reply(err);
  }
};
