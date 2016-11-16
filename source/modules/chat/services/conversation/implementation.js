import { find, pick } from 'lodash';
import * as socketService from '../../../../shared/services/socket';
import * as conversationRepo from '../../repositories/conversation';
import * as newMessageNotification from '../../notifications/new-message';

export const findExistingConversation = async (participantIds) => {
  return conversationRepo.findExistingConversation(participantIds);
};

export const createConversationWithParticipants = async (type, creatorId, participants) => {
  return conversationRepo.createConversation(type, creatorId, participants);
};

export const assertThatUserIsPartOfTheConversation = (conversation, userId) => {
  return conversation.users.some(user => user.id === userId);
};

export const searchMessageCreatorIdForConversation = (conversation) => {
  if (!conversation.lastMessage) return null;

  return conversation.lastMessage.createdBy;
};

export const replaceConversationUserIdWithObject = (conversation, users) => {
  const lastMessage = conversation.lastMessage;

  if (lastMessage) {
    const matchingUser = find(users, { id: lastMessage.createdBy });
    const attrs = ['type', 'id', 'username', 'fullName', 'profileImg'];

    lastMessage.createdBy = pick(matchingUser, attrs);
  }

  return { ...conversation, lastMessage };
};

export const notifyUsersForNewMessage = (conversation, message, authenticationToken) => {
  const usersToNotify = conversation.users.filter(user => user.id !== message.createdBy.id);

  newMessageNotification.send(message, usersToNotify);
  socketService.send('send-message', usersToNotify, message, authenticationToken);
};
