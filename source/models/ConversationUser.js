import Sequelize from 'sequelize';
import model from 'connection';
import Conversation from 'models/Conversation';
import User from 'models/User';

const ConversationUser = model.define('ConversationUser', {
  conversationId: {
    type: Sequelize.INTEGER,
  },
  userId: {
    type: Sequelize.INTEGER,
  },
}, {
  tableName: 'conversation_user',
});

ConversationUser.sync({ force: true });

export const users = Conversation.belongsToMany(User, {
  through: {
    model: ConversationUser,
    unique: true,
  },
  foreignkey: 'conversation_id',
});

User.belongsToMany(Conversation, {
  through: {
    model: ConversationUser,
    unique: true,
  },
  foreignkey: 'user_id',
});

// User.belongsTo(Conversation, { foreignkey: 'fk_user' });

export default ConversationUser;
