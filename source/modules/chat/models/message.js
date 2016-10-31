import * as dateUtils from '../../../shared/utils/date';
import createConversationModel from './conversation';
import createUserModel from '../../core/models/user';

export default (dao) => ({
  type: 'conversation_message',
  id: dao.id.toString(),
  conversationId: dao.parentId.toString(),
  conversation: dao.Conversation ? createConversationModel(dao.Conversation) : null,
  text: dao.text,
  createdBy: createUserModel(dao.User),
  createdAt: dateUtils.toISOString(dao.created_at),
  updatedAt: dateUtils.toISOString(dao.updated_at),
});
