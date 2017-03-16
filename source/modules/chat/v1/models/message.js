const dateUtils = require('../../../../shared/utils/date');
const createUserModel = require('../../../core/models/user');
const createConversationModel = require('./conversation');

export default (dao) => ({
  type: 'conversation_message',
  id: dao.id.toString(),
  conversationId: null,
  conversation: dao.Conversation ? createConversationModel(dao.Conversation) : null,
  text: dao.text,
  createdBy: createUserModel(dao.User),
  createdAt: dateUtils.toISOString(dao.created_at),
  updatedAt: dateUtils.toISOString(dao.updated_at),
});
