import createError from '../../../../shared/utils/create-error';
import * as impl from './implementation';

export const create = async (payload, message) => {
  const participants = [...payload.participants, message.credentials.id];

  if (participants.length < 2) {
    throw createError('403', 'A conversation must have 2 or more participants');
  }

  if (participants[0].toString() === participants[1].toString()) {
    throw createError('403', 'You cannot create a conversation with yourself');
  }

  const conversation = await impl.findExistingConversation(participants);

  if (!conversation) {
    return impl.createConversationWithParticipants(
      payload.type, message.credentials.id, participants);
  }

  return conversation;
};
