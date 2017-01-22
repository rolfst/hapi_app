import R from 'ramda';
import * as Logger from '../../../../../shared/services/logger';
import * as userRepo from '../../../../core/repositories/user';
import * as objectService from '../../../../feed/services/object';
import * as objectRepository from '../../../../feed/repositories/object';
import * as messageService from '../../../../feed/services/message';
import * as conversationRepo from '../../repositories/conversation';
import * as conversationRepoV1 from '../../../v1/repositories/conversation';
import * as impl from './implementation';

const logger = Logger.createLogger('CHAT/service/conversation');
const PAGINATION_PROPERTIES = ['limit', 'offset'];

/**
 * Create conversation
 * @param {object} payload - Object containing payload data
 * @param {string} payload.type - The type of the conversation
 * @param {string[]} payload.participantIds - The ids of the participants
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Conversation>} {@link module:modules/chat~Conversation} -
 */
export const create = async (payload, message) => {
  logger.info('Creating conversation', { payload, message });
  const attributes = R.pick(['type', 'participantIds'], payload);

  return conversationRepo.create({ ...attributes, userId: message.credentials.id });
};

/**
 * Retrieve conversations by ids.
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.conversationIds - The ids to retrieve
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
  const [conversations, objects] = await Promise.all([
    conversationRepo.findByIds(payload.conversationIds, options),
    objectRepository.findBy({
      parentType: 'conversation', parentId: { $in: payload.conversationIds } }),
  ]);

  if (objects.length === 0) return conversations;

  const lastMessageObjects = await impl.lastMessageObjectsForConversations(objects);
  const lastMessages = await messageService.list({
    messageIds: R.pluck('sourceId', lastMessageObjects) });
  const mergeLastMessage = impl.mergeLastMessageWithConversation(lastMessageObjects, lastMessages);

  if (includes('participants')) {
    const userIds = R.pipe(R.pluck('participantIds'), R.flatten, R.uniq)(conversations);
    const participants = await userRepo.findPlainUsersByIds(userIds);
    const conversationWithParticipants = await impl.addParticipantsToConversation(
      conversations, participants);

    return R.map(mergeLastMessage, conversationWithParticipants);
  }

  return R.map(mergeLastMessage, conversations);
};

/**
 * Retrieve conversations for specific user.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.userId - The id of the user
 * @param {string} [payload.limit] - The limit for the conversations resultset
 * @param {string} [payload.offset] - The offset for the conversation resultset
 * @param {string} [payload.include] - The resources to directly include
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
 * @param {string} payload.conversationId - The id of the conversation
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

  const objects = await objectService.list({
    ...options,
    parentType: 'conversation',
    parentId: payload.conversationId,
  }, message);

  return messageService.list({ messageIds: R.pluck('sourceId', objects) }, message);
};

/**
 * Get conversation count for user to use for pagination data.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.userId - The id of the user
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method countConversations
 * @return {external:Promise<Number>}
 */
export async function countConversations(payload, message) {
  logger.info('Count conversation', { payload, message });

  return conversationRepo.countConversationsForUser(payload.userId);
}

export const remove = async (payload, message) => {
  logger.info('Deleting conversation', { payload, message });

  await conversationRepoV1.deleteConversationById(payload.conversationId);
  await objectService.remove({
    parentType: 'conversation', parentId: payload.conversationId }, message);
};

/**
 * Get messages count for conversation to use for pagination data.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.conversationId - The id of the conversation
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method countMessages
 * @return {external:Promise<Number>}
 */
export async function countMessages(payload, message) {
  logger.info('Count messages for conversation', { payload, message });

  await impl.assertThatUserIsPartOfTheConversation(message.credentials.id, payload.conversationId);

  return objectService.count({
    where: {
      parentType: 'conversation',
      parentId: payload.conversationId,
      objectType: 'message',
    } });
}
