import Sequelize from 'sequelize';
import { db as model } from '../../../../connections';

const Message = model.define('Message', {
  objectId: {
    type: Sequelize.INTEGER,
    field: 'object_id',
    allowNull: true,
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
