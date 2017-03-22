const UserModel = require('../../../../core/repositories/dao/user');
const ConversationModel = require('./conversation');
const ConversationUserModel = require('./conversation-user');
const MessageModel = require('./message');

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


// exports of functions
exports.Conversation = ConversationModel;
exports.Message = MessageModel;
exports.ConversationUser = ConversationUserModel;
