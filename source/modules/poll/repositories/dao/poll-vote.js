import Sequelize from 'sequelize';
import { db as model } from '../../../../connections';

const PollVote = model.define('PollVote', {
  pollId: {
    type: Sequelize.INTEGER,
    field: 'poll_id',
    allowNull: false,
  },
  optionId: {
    type: Sequelize.INTEGER,
    field: 'option_id',
    allowNull: false,
  },
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false,
  },
}, {
  tableName: 'poll_votes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default PollVote;
