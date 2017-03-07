import Sequelize from 'sequelize';
import model from '../../../../../shared/configs/sequelize';

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
  timestamps: false,
});

export default ConversationUser;