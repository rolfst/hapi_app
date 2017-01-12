import R from 'ramda';
import createError from '../../../../../shared/utils/create-error';
import * as conversationRepo from '../../repositories/conversation';

const findById = (id, collection) => R.find(R.whereEq({ id }), collection) || null;
const byId = R.ascend(R.prop('id'));
const parseIncludes = R.split(',');

export const hasInclude = R.curry((includes, selector) =>
  R.contains(selector, parseIncludes(includes || '')));

export const messagesForConversation = R.curry((messages, conversation) =>
  R.filter(R.whereEq({ conversationId: conversation.id }), messages));

export const lastMessage = R.pipe(R.sort(byId), R.last);

export const conversationWithLastMessage = R.curry((getMessages, conversation) =>
  R.merge(conversation, { lastMessage: lastMessage(getMessages(conversation)) || null }));

const getParticipants = (participants, participantIds) => R.pipe(
  R.map((participantId) => findById(participantId, participants)),
  R.reject(R.isNil)
)(participantIds);

const mergeParticipants = R.curry((participants, conversation) => R.merge(conversation, {
  participants: getParticipants(participants, conversation.participantIds),
}));

export const addParticipantsToConversation = R.curry((conversations, participants) => {
  return R.map(mergeParticipants(participants), conversations);
});

export const assertThatUserIsPartOfTheConversation = async (userId, conversationId) => {
  const result = await R.pipeP(conversationRepo.findByIds, R.head)([conversationId]);

  if (!result || !R.contains(userId, result.participantIds)) throw createError('404');
};
