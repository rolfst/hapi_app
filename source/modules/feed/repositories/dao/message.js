import Sequelize from 'sequelize';
import { db as model } from '../../../../connections';

const Message = model.define('Message', {
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false,
  },
  text: {
    type: Sequelize.STRING,
    field: 'text',
    allowNull: false,
  },
}, {
  tableName: 'messages',
  createdAt: 'created_at',
  updatedAt: false,
});

export default Message;
