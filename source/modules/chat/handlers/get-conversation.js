import { check } from 'hapi-acl-plugin';
import { findConversationById } from 'modules/chat/repositories/conversation';
import * as responseUtil from 'shared/utils/response';

module.exports = async (req, reply) => {
  const { credentials } = req.auth;

  try {
    const conversation = await findConversationById(req.params.id);

    check(credentials, 'get-conversation', conversation, 'You\'re not part of this conversation');

    return reply({ data: responseUtil.serialize(conversation) });
  } catch (err) {
    return reply(err);
  }
};
