import * as dateUtils from '../../../../shared/utils/date';
import createUserModel from '../../../core/models/user';
import createConversationModel from './conversation';

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
