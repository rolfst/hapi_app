import Sequelize from 'sequelize';
import model from 'connection';
import Conversation from 'models/Conversation';
import User from 'models/User';

const ConversationUser = model.define('ConversationUser', {
  conversationId: {
    type: Sequelize.INTEGER,
    field: 'conversation_id',
  },
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
  },
}, {
  tableName: 'conversation_user',
});

ConversationUser.sync();

Conversation.belongsToMany(User, {
  through: {
    model: ConversationUser,
    unique: true,
  },
  as: 'users',
  foreignkey: 'conversation_id',
});

User.belongsToMany(Conversation, {
  through: {
    model: ConversationUser,
    unique: true,
  },
  as: 'conversations',
  foreignkey: 'user_id',
});

// User.belongsTo(Conversation, { foreignkey: 'fk_user' });

export default ConversationUser;
