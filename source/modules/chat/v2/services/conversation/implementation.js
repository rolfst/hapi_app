import R from 'ramda';
import createError from '../../../../../shared/utils/create-error';
import * as objectRepository from '../../../../feed/repositories/object';
import * as conversationRepo from '../../repositories/conversation';

const findPropEq = (prop, value, collection) => R.find(R.propEq(prop, value), collection);
const findById = (id, collection) => R.find(R.whereEq({ id }), collection) || null;
const parseIncludes = R.split(',');
const sortedById = R.sortBy(R.prop('id'));

export const hasInclude = R.curry((includes, selector) =>
  R.contains(selector, parseIncludes(includes || '')));

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

export const lastMessageObjectsForConversations = async (conversationIds) => {
  const objects = await objectRepository.findBy({
    parentType: 'conversation',
    parentId: { $in: conversationIds },
  });

  const messagesForConversation = (conversationId) => R.filter(
    R.whereEq({ parentId: conversationId }), objects);

  return R.reduce((acc, conversationId) => {
    const lastMessage = R.last(sortedById, messagesForConversation(conversationId));

    return acc.concat(lastMessage);
  }, [])(conversationIds);
};

export const mergeLastMessageWithConversation = R.curry((objects, lastMessages, conversation) => {
  const lastMessageObject = findPropEq('parentId', conversation.id, objects);
  const lastMessageModel = findPropEq('id', lastMessageObject.sourceId, lastMessages);

  return { ...conversation, lastMessage: lastMessageModel };
});
