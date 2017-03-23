const R = require('ramda');
const { PollVote } = require('./dao');
const createPollVoteModel = require('../models/poll-vote');

exports.findBy = async (whereConstraint) => PollVote
  .findAll({ where: whereConstraint })
  .then(R.map(createPollVoteModel));
