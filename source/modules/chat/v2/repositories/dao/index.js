import UserModel from '../../../../core/repositories/dao/user';
import ConversationModel from './conversation';
import ConversationUserModel from './conversation-user';
import PrivateMessageModel from './private-message';

ConversationModel.belongsToMany(UserModel, {
  foreignKey: 'conversation_id',
  otherKey: 'user_id',
  through: ConversationUserModel,
  timestamps: false,
});

UserModel.belongsToMany(ConversationModel, {
  as: 'conversations',
  foreignKey: 'user_id',
  otherKey: 'conversation_id',
  through: ConversationUserModel,
  timestamps: false,
});

PrivateMessageModel.belongsTo(UserModel, {
  foreignKey: 'user_id',
});

export const Conversation = ConversationModel;
export const ConversationUser = ConversationUserModel;
export const PrivateMessage = PrivateMessageModel;
