import { check } from 'hapi-acl-plugin';
import { Conversation, User } from 'modules/chat/models';
import notifier from 'common/services/notifier';
import socket from 'common/services/socket';
import respondWithItem from 'common/utils/respond-with-item';
import { findConversationById } from 'modules/chat/repositories/conversation';
import { findMessageById, createMessage } from 'modules/chat/repositories/message';

module.exports = async (req, reply) => {
  const loggedUser = req.auth.credentials;
  const conversationIncludes = [{ model: User }];

  try {
    const conversation = await findConversationById(req.params.id, conversationIncludes);

    check(loggedUser, 'get-conversation', conversation, 'You\'re not part of this conversation');

    const createdMessage = await createMessage(conversation.id, loggedUser.id, req.payload.text);
    const message = await findMessageById(createdMessage.id, [Conversation, User]);

    const usersToNotify = conversation.Users.filter(user => user.id !== loggedUser.id);
    const response = respondWithItem(message);

    notifier.sendForMessage(usersToNotify, message);
    socket.send('send-message', usersToNotify, response, req.headers['x-api-token']);

    return reply({ success: true, data: response });
  } catch (err) {
    return reply(err);
  }
};
