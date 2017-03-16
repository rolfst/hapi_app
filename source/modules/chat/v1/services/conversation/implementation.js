const { find, pick } = require('lodash');
const conversationRepo = require('../../repositories/conversation');

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

  return conversation.lastMessage.userId;
};

export const replaceConversationUserIdWithObject = (conversation, users) => {
  const lastMessage = conversation.lastMessage;

  if (lastMessage) {
    const matchingUser = find(users, { id: lastMessage.userId });
    const attrs = ['type', 'id', 'username', 'fullName', 'profileImg'];

    lastMessage.userId = pick(matchingUser, attrs);
  }

  return { ...conversation, lastMessage };
};
