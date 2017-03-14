import R from 'ramda';
import { PollVote } from './dao';
import createPollVoteModel from '../models/poll-vote';

export const findBy = async (whereConstraint) => PollVote
  .findAll({ where: whereConstraint })
  .then(R.map(createPollVoteModel));
