const UserModel = require('../../../../core/repositories/dao/user');
const ConversationModel = require('./conversation');
const ConversationUserModel = require('./conversation-user');
const PrivateMessageModel = require('./private-message');

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


// exports of functions
module.exports = {
  Conversation: ConversationModel,
  ConversationUser: ConversationUserModel,
  PrivateMessage: PrivateMessageModel,
};
