import Sequelize from 'sequelize';
import { db as model } from '../../../../connections';

const Poll = model.define('Poll', {
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false,
  },
  networkId: {
    type: Sequelize.INTEGER,
    field: 'network_id',
    allowNull: false,
  },
}, {
  tableName: 'polls',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default Poll;
