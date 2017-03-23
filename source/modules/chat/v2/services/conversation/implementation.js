const R = require('ramda');
const createError = require('../../../../../shared/utils/create-error');
const conversationRepo = require('../../repositories/conversation');

const parseIncludes = R.split(',');

const hasInclude = R.curry((includes, selector) =>
  R.contains(selector, parseIncludes(includes || '')));

const assertThatUserIsPartOfTheConversation = async (userId, conversationId) => {
  const result = await R.pipeP(conversationRepo.findByIds, R.head)([conversationId]);

  if (!result || !R.contains(userId, result.participantIds)) throw createError('404');
};

exports.assertThatUserIsPartOfTheConversation = assertThatUserIsPartOfTheConversation;
exports.hasInclude = hasInclude;
