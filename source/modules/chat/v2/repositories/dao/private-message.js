import Sequelize from 'sequelize';
import { db as model } from '../../../../../connections';

const PrivateMessage = model.define('PrivateMessage', {
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false,
  },
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
  tableName: 'private_messages',
  createdAt: 'created_at',
  updatedAt: false,
});

export default PrivateMessage;
