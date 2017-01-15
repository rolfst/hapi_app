import R from 'ramda';
import * as Logger from '../../../../../shared/services/logger';
import * as userRepo from '../../../../core/repositories/user';
import * as conversationRepo from '../../repositories/conversation';
import * as messageRepo from '../../repositories/message';
import * as impl from './implementation';

const logger = Logger.createLogger('CHAT/service/conversation');
const PAGINATION_PROPERTIES = ['limit', 'offset'];

/**
 * Retrieve conversations by ids.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.conversationIds - The ids to retrieve
 * @param {string} [payload.limit] - The limit for the conversations resultset
 * @param {string} [payload.offset] - The offset for the conversation resultset
 * @param {String} [payload.include] - The resources to directly include
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listConversations
 * @return {external:Promise.<Conversation[]>} {@link module:modules/chat~Conversation} -
 */
export const listConversations = async (payload, message) => {
  logger.info('Listing conversations', { payload, message });

  const options = R.pick(PAGINATION_PROPERTIES, payload);
  const includes = impl.hasInclude(payload.include);
  const conversations = await conversationRepo.findByIds(payload.conversationIds, options);
  const messagesForConversation = await R.pipeP(
    messageRepo.findForConversations,
    impl.messagesForConversation
  )(payload.conversationIds);

  const createResult = R.map(impl.conversationWithLastMessage(messagesForConversation));

  if (includes('participants')) {
    const userIds = R.pipe(R.pluck('participantIds'), R.flatten, R.uniq)(conversations);
    const participants = await userRepo.findPlainUsersByIds(userIds);
    const conversationWithParticipants = await impl.addParticipantsToConversation(
      conversations, participants);

    return createResult(conversationWithParticipants);
  }

  return createResult(conversations);
};

/**
 * Retrieve conversations for specific user.
 * @param {object} payload - Object containing payload data
 * @param {String} payload.userId - The id of the user
 * @param {String} [payload.include] - The resources to directly include
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listConversationsForUser
 * @return {external:Promise.<Conversation[]>} {@link module:modules/chat~Conversation} -
 */
export const listConversationsForUser = async (payload, message) => {
  logger.info('Listing conversations for user', { payload, message });

  const conversationIds = await conversationRepo.findIdsForUser(payload.userId);

  return listConversations({ conversationIds, ...payload }, message);
};

/**
 * List the messages that are created for a conversation.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.conversationId - The id of the conversation
 * @param {string} [payload.limit] - The limit for the conversations resultset
 * @param {string} [payload.offset] - The offset for the conversation resultset
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listMessages
 * @return {external:Promise.<Message[]>} {@link module:modules/chat~Message} -
 */
export const listMessages = async (payload, message) => {
  logger.info('List messages for conversation', { payload, message });

  const options = R.pick(PAGINATION_PROPERTIES, payload);

  await impl.assertThatUserIsPartOfTheConversation(message.credentials.id, payload.conversationId);

  return messageRepo.findForConversation(payload.conversationId, options);
};

export async function countConversations(payload, message) {
  logger.info('Count conversation', { payload, message });

  return conversationRepo.countConversationsForUser(payload.userId);
}

export async function countMessages(payload, message) {
  logger.info('Count messages for conversation', { payload, message });

  await impl.assertThatUserIsPartOfTheConversation(message.credentials.id, payload.conversationId);

  return messageRepo.countForConversation(payload.conversationId);
}
