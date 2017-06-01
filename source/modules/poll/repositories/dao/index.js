const UserModel = require('../../../core/repositories/dao/user');
const PollModel = require('./poll');
const PollOptionModel = require('./poll-option');
const PollVoteModel = require('./poll-vote');

PollModel.hasMany(PollOptionModel, {
  foreignKey: 'poll_id',
  as: 'Options',
});

PollOptionModel.hasMany(PollVoteModel, {
  foreignKey: 'option_id',
  as: 'Votes',
});

exports.Poll = PollModel;
exports.PollOption = PollOptionModel;
exports.PollVote = PollVoteModel;
