import Sequelize from 'sequelize';
import model from 'connection';

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

export default ConversationUser;
