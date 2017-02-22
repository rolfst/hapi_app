import UserModel from '../../../../../shared/models/user';
import ConversationModel from './conversation';
import ConversationUserModel from './conversation-user';
import MessageModel from './message';

ConversationModel.belongsToMany(UserModel, {
  foreignKey: 'conversation_id',
  otherKey: 'user_id',
  through: ConversationUserModel,
  timestamps: false,
});

MessageModel.belongsTo(UserModel, {
  foreignKey: 'user_id',
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
