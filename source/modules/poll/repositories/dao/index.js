import UserModel from '../../../../shared/models/user';
import PollModel from './poll';
import PollOptionModel from './poll-option';
import PollVoteModel from './poll-vote';

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
