import { check } from 'hapi-acl-plugin';
import * as responseUtil from 'shared/utils/response';
import { findConversationById } from 'modules/chat/repositories/conversation';
import { findAllForConversation } from 'modules/chat/repositories/message';

module.exports = async (req, reply) => {
  try {
    const { credentials } = req.auth;
    const modelIncludes = [];
    const conversation = await findConversationById(req.params.id, modelIncludes);

    check(credentials, 'get-conversation', conversation, 'You\'re not part of this conversation');

    const messages = await findAllForConversation(conversation);

    return reply({ data: responseUtil.serialize(messages) });
  } catch (err) {
    return reply(err);
  }
};