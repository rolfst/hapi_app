import R from 'ramda';
import { Poll, PollOption, PollVote } from './dao';
import createPollModel from '../models/poll';
import createPollVoteModel from '../models/poll-vote';

const defaultIncludes = [{
  model: PollOption,
  as: 'Options',
  order: ['order', 'ASC'],
  include: [{ model: PollVote, as: 'Votes' }],
}];

/**
 * Find a specific poll by id
 * @param {string} id - Id of the poll
 * @method findPollById
 * @return {external:Promise} - Find poll promise
 */
export const findById = async (id, includes = defaultIncludes) => {
  const poll = await Poll.findById(id, includes ? { include: includes } : {});

  if (!poll) return null;

  return createPollModel(poll);
};

/**
 * Create a new poll
 * @param {object} attributes - Poll attributes
 * @param {string} attributes.userId - Id of the user creating the poll
 * @param {string} attributes.networkId - Id of the network the poll is placed in
 * @method create
 * @return {external:Promise} - Create poll promise
 */
export const create = async (attributes) => {
  const whitelist = ['userId', 'networkId'];
  const poll = await Poll.create(R.pick(whitelist, attributes));

  return createPollModel(poll);
};

/**
 * Vote for a poll option
 * @param {object} attributes - PollVote attributes
 * @param {string} attributes.userId - Id of the user voting
 * @param {string} attributes.pollId - Id of the poll the user is voting on
 * @param {string} attributes.optionId - Id of the option
 * @method vote
 * @return {external:Promise} - Vote promise
 */
export const vote = async (attributes) => {
  const whitelist = ['userId', 'pollId', 'optionId'];

  const pollVote = await PollVote.create(R.pick(whitelist, attributes));

  return createPollVoteModel(pollVote);
};

/**
 * Remove all votes for a specific user
 * @param {string} pollId - Id of the poll voted on
 * @param {string} userId - The user that voted
 * @method clearVotes
 * @return {external:Promise} - Destroy promise
 */
export const clearVotes = (pollId, userId) => (
  PollVote.destroy({ where: { pollId, userId } })
);
