import Sequelize from 'sequelize';
import { db as model } from '../../../../connections';

const TeamUser = model.define('TeamUser', {
  teamId: {
    type: Sequelize.INTEGER,
    field: 'team_id',
    allowNull: false,
  },
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false,
  },
}, {
  tableName: 'team_user',
  timestamps: false,
  createdAt: false,
  updatedAt: false,
});

export default TeamUser;
