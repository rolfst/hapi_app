const UserModel = require('../../../core/repositories/dao/user');
const PollModel = require('./poll');
const PollOptionModel = require('./poll-option');
const PollVoteModel = require('./poll-vote');

PollModel.belongsTo(UserModel, {
  foreignKey: 'user_id',
});

PollModel.hasMany(PollOptionModel, {
  foreignKey: 'poll_id',
  as: 'Options',
});

PollOptionModel.hasMany(PollVoteModel, {
  foreignKey: 'option_id',
  as: 'Votes',
});

export const Poll = PollModel;
export const PollOption = PollOptionModel;
export const PollVote = PollVoteModel;
