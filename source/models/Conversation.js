import Sequelize from 'sequelize';
import model from 'connection';
import Message from 'models/Message';

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
  updatedAt: false,
  getterMethods: {
    type: () => 'conversations',
  },
});

Conversation.hasMany(Message, {
  foreignKey: 'parent_id',
  scope: {
    parent_type: 'FlexAppeal\\Entities\\Conversation',
  },
});

export default Conversation;
