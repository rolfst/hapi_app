import * as conversationRepo from '../../repositories/conversation';

export const findExistingConversation = async (participantIds) => {
  return conversationRepo.findExistingConversation(participantIds);
};

export const createConversationWithParticipants = async (type, creatorId, participants) => {
  return conversationRepo.createConversation(type, creatorId, participants);
};
