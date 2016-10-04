import { check } from 'hapi-acl-plugin';
import { User } from '../../../shared/models';
import socket from '../../../shared/services/socket';
import * as responseUtil from '../../../shared/utils/response';
import { Conversation } from '../models';
import { findConversationById } from '../repositories/conversation';
import { findMessageById, createMessage } from '../repositories/message';
import * as newMessageNotification from '../notifications/new-message';

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
    const data = responseUtil.serialize(message);

    newMessageNotification.send(message, usersToNotify);
    socket.send('send-message', usersToNotify, data, req.headers['x-api-token']);

    return reply({ success: true, data });
  } catch (err) {
    return reply(err);
  }
};
