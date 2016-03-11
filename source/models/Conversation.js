import Sequelize from 'sequelize';
import model from 'connection';
import User from './User'; // deze is undefined

const Conversation = model.define('Conversation', {
  type: {
    type: Sequelize.ENUM,
    values: ['private', 'group'],
    validate: {
      isIn: ['private', 'group'],
    },
  },
}, {
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Conversation.sync();

export default Conversation;
