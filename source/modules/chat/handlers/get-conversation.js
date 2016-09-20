import _ from 'lodash';
import { check } from 'hapi-acl-plugin';
import { Message } from 'modules/chat/models';
import { findConversationById } from 'modules/chat/repositories/conversation';
import * as responseUtil from 'shared/utils/response';
import parseIncludes from 'shared/utils/parse-includes';

module.exports = async (req, reply) => {
  const { credentials } = req.auth;
  const includes = parseIncludes(req.query);
  const modelIncludes = [];

  if (_.includes(includes, 'messages')) modelIncludes.push({ model: Message });

  try {
    const conversation = await findConversationById(req.params.id, modelIncludes);

    check(credentials, 'get-conversation', conversation, 'You\'re not part of this conversation');

    return reply({ data: responseUtil.serialize(conversation) });
  } catch (err) {
    return reply(err);
  }
};
