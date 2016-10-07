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
  return conversation.Users.some(user => user.id === userId);
};

export const notifyUsersForNewMessage = (conversation, message, authenticationToken) => {
  const usersToNotify = conversation.Users.filter(user => user.id !== message.createdBy);

  newMessageNotification.send(message, usersToNotify);
  socketService.send('send-message', usersToNotify, message.toJSON(), authenticationToken);
};
