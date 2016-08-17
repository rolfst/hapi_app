import { check } from 'hapi-acl-plugin';
import { User } from 'common/models';
import socket from 'common/services/socket';
import respondWithItem from 'common/utils/respond-with-item';
import { Conversation } from 'modules/chat/models';
import { findConversationById } from 'modules/chat/repositories/conversation';
import { findMessageById, createMessage } from 'modules/chat/repositories/message';
import * as newMessageNotification from 'modules/chat/notifications/new-message';

module.exports = async (req, reply) => {
  const loggedUser = req.auth.credentials;
  const conversationIncludes = [];

  try {
    const conversation = await findConversationById(req.params.id, conversationIncludes);

    check(loggedUser, 'get-conversation', conversation, 'You\'re not part of this conversation');

    const createdMessage = await createMessage(conversation.id, loggedUser.id, req.payload.text);
    const message = await findMessageById(createdMessage.id,
      [{ model: Conversation, include: [User] }, User]);

    const usersToNotify = conversation.Users.filter(user => user.id !== loggedUser.id);
    const data = respondWithItem(message);

    newMessageNotification.send(message, usersToNotify);
    socket.send('send-message', usersToNotify, data, req.headers['x-api-token']);

    return reply({ success: true, ...data });
  } catch (err) {
    console.log('Error creating message', err);
    return reply(err);
  }
};
