import ConversationModel from './conversation';
import ConversationUserModel from './conversation-user';
import MessageModel from './message';
import UserModel from 'shared/models/user';

ConversationModel.belongsToMany(UserModel, {
  foreignKey: 'conversation_id',
  otherKey: 'user_id',
  through: ConversationUserModel,
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
  through: ConversationUserModel,
  timestamps: false,
});

export const Conversation = ConversationModel;
export const Message = MessageModel;
export const ConversationUser = ConversationUserModel;
