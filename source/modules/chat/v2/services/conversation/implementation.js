import R from 'ramda';
import createError from '../../../../../shared/utils/create-error';
import * as messageService from '../../../../feed/services/message';
import * as objectRepository from '../../../../feed/repositories/object';
import * as conversationRepo from '../../repositories/conversation';

const findById = (id, collection) => R.find(R.whereEq({ id }), collection) || null;
const parseIncludes = R.split(',');

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

  return R.reduce((acc, conversationId) => {
    const messagesForConversation = R.filter(
      R.whereEq({ parentId: conversationId }), objects);
    const lastMessage = R.last(
      R.sortBy(R.prop('id'), messagesForConversation));

    return acc.concat(lastMessage);
  }, [])(conversationIds);
};

export const mergeLastMessageWithConversation = R.curry((lastMessageObjects, lastMessages, conversation) => {
  const lastMessageObject = R.find(R.whereEq({ parentId: conversation.id }), lastMessageObjects);
  const lastMessageModel = R.find(R.propEq('id', lastMessageObject.sourceId), lastMessages);

  return { ...conversation, lastMessage: lastMessageModel };
});
