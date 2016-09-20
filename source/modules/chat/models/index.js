import ConversationModel from 'modules/chat/models/conversation';
import MessageModel from 'modules/chat/models/message';
import UserModel from 'shared/models/user';

ConversationModel.belongsToMany(UserModel, {
  foreignKey: 'conversation_id',
  otherKey: 'user_id',
  through: 'conversation_user',
  timestamps: false,
});

ConversationModel.hasMany(MessageModel, {
  foreignKey: 'parent_id',
  scope: {
    parent_type: 'FlexAppeal\\Entities\\Conversation',
  },
});

ConversationModel.hasOne(MessageModel, {
  foreignKey: 'parent_id',
  as: 'LastMessage',
  scope: {
    parent_type: 'FlexAppeal\\Entities\\Conversation',
  },
  limit: 1,
  order: 'created_at DESC',
});

MessageModel.belongsTo(UserModel, {
  foreignKey: 'created_by',
});

MessageModel.belongsTo(ConversationModel, {
  foreignKey: 'parent_id',
});

UserModel.belongsToMany(ConversationModel, {
  as: 'conversations',
  foreignKey: 'user_id',
  otherKey: 'conversation_id',
  through: 'conversation_user',
  timestamps: false,
});

export const Conversation = ConversationModel;
export const Message = MessageModel;
