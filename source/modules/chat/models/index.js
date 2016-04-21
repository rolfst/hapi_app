import ConversationModel from 'modules/chat/models/conversation';
import MessageModel from 'modules/chat/models/message';
import UserModel from 'common/models/user';

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
export const User = UserModel;
export const Message = MessageModel;
