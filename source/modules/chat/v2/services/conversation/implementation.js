import R from 'ramda';
import createError from '../../../../../shared/utils/create-error';
import * as conversationRepo from '../../repositories/conversation';

const parseIncludes = R.split(',');

export const hasInclude = R.curry((includes, selector) =>
  R.contains(selector, parseIncludes(includes || '')));

export const assertThatUserIsPartOfTheConversation = async (userId, conversationId) => {
  const result = await R.pipeP(conversationRepo.findByIds, R.head)([conversationId]);

  if (!result || !R.contains(userId, result.participantIds)) throw createError('404');
};
