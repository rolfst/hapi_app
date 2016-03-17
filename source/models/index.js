import ConversationModel from 'models/Conversation';
import UserModel from 'models/User';
import MessageModel from 'models/Message';

UserModel.belongsToMany(ConversationModel, {
  as: 'conversations',
  foreignKey: 'user_id',
  otherKey: 'conversation_id',
  through: 'conversation_user',
  timestamps: false,
});

ConversationModel.hasMany(MessageModel, {
  foreignKey: 'parent_id',
  scope: {
    parent_type: 'FlexAppeal\\Entities\\Conversation',
  },
});

ConversationModel.belongsToMany(UserModel, {
  foreignKey: 'conversation_id',
  otherKey: 'user_id',
  through: 'conversation_user',
  timestamps: false,
});

MessageModel.belongsTo(UserModel, { foreignKey: 'created_by' });

export const Conversation = ConversationModel;
export const User = UserModel;
export const Message = MessageModel;
