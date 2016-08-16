import _ from 'lodash';
import { Message } from 'modules/chat/models';
import respondWithCollection from 'common/utils/respond-with-collection';
import parseIncludes from 'common/utils/parse-includes';
import { findAllForUser } from 'modules/chat/repositories/conversation';

module.exports = async (req, reply) => {
  const includes = parseIncludes(req.query);

  const modelIncludes = [];

  if (_.includes(includes, 'messages')) {
    modelIncludes.push({ model: Message });
  } else {
    modelIncludes.push({ model: Message, limit: 1, order: 'created_at DESC' });
  }

  try {
    let conversations = await findAllForUser(req.auth.credentials, modelIncludes);

    if (!_.includes(includes, 'messages')) {
      conversations = _.map(conversations, conversation => {
        return _.omit(conversation, 'Messages');
      });
    }

    return reply(respondWithCollection(conversations));
  } catch (boom) {
    return reply(boom);
  }
};
