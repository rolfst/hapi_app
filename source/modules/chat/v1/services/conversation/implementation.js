const R = require('ramda');
const { find, pick } = require('lodash');
const conversationRepo = require('../../repositories/conversation');

const findExistingConversation = async (participantIds) => {
  return conversationRepo.findExistingConversation(participantIds);
};

const createConversationWithParticipants = async (type, creatorId, participants) => {
  return conversationRepo.createConversation(type, creatorId, participants);
};

const assertThatUserIsPartOfTheConversation = (conversation, userId) => {
  return conversation.users.some((user) => user.id === userId);
};

const searchMessageCreatorIdForConversation = (conversation) => {
  if (!conversation.lastMessage) return null;

  return conversation.lastMessage.userId;
};

const replaceConversationUserIdWithObject = (conversation, users) => {
  const lastMessage = conversation.lastMessage;

  if (lastMessage) {
    const matchingUser = find(users, { id: lastMessage.userId });
    const attrs = ['type', 'id', 'username', 'fullName', 'profileImg'];

    lastMessage.userId = pick(matchingUser, attrs);
  }

  return R.merge(conversation, lastMessage);
};

exports.assertThatUserIsPartOfTheConversation = assertThatUserIsPartOfTheConversation;
exports.createConversationWithParticipants = createConversationWithParticipants;
exports.findExistingConversation = findExistingConversation;
exports.replaceConversationUserIdWithObject = replaceConversationUserIdWithObject;
exports.searchMessageCreatorIdForConversation = searchMessageCreatorIdForConversation;
