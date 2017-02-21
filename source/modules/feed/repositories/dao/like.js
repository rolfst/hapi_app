import Sequelize from 'sequelize';
import { db as model } from '../../../../connections';

const Like = model.define('Like', {
  messageId: {
    type: Sequelize.INTEGER,
    field: 'message_id',
    allowNull: false,
  },
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false,
  },
  createdAt: {
    type: Sequelize.DATE,
    field: 'created_at',
  },
}, {
  tableName: 'likes',
  createdAt: 'created_at',
  updatedAt: false,
});

export default Like;
