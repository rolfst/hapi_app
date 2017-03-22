const R = require('ramda');
const Logger = require('../../../../../shared/services/logger');
const createError = require('../../../../../shared/utils/create-error');
const userRepository = require('../../../../core/repositories/user');
const objectService = require('../../../../core/services/object');
const objectRepository = require('../../../../core/repositories/object');
const conversationRepoV1 = require('../../../v1/repositories/conversation');
const conversationRepo = require('../../repositories/conversation');
const impl = require('./implementation');

const logger = Logger.createLogger('CHAT/service/conversation');
const createOptions = R.pick(['limit', 'offset', 'order']);
const pluckUniqueParticipantIds = R.pipe(R.pluck('participantIds'), R.flatten, R.uniq);
const groupByParentId = R.groupBy(R.prop('parentId'));
const findIdEq = (id, collection) => R.find(R.propEq('id', id), collection);
const lastMessageObjectsByConversationId = R.pipe(
  R.sort(R.descend(R.prop('createdAt'))),
  groupByParentId,
  R.map(R.head)
);

/**
 * Create conversation
 * @param {object} payload - Object containing payload data
 * @param {string} payload.type - The type of the conversation
 * @param {string[]} payload.participantIds - The ids of the participants
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Conversation>} {@link module:modules/chat~Conversation} -
 */
const create = async (payload, message) => {
  logger.info('Creating conversation', { payload, message });
  const participantIds = R.pipe(R.append(message.credentials.id), R.uniq)(payload.participantIds);

  const users = await userRepository.findByIds(participantIds);

  if (users.length < 2) {
    throw createError('422', 'A conversation must have 2 or more participants');
  }

  const existingConversation = await conversationRepo.findExistingConversation(participantIds);

  if (existingConversation) return existingConversation;

  return conversationRepo.create({
    type: payload.type,
    participantIds,
    userId: message.credentials.id,
  });
};

/**
 * Retrieve conversations by ids, ordered by updated at Desc.
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.conversationIds - The ids to retrieve
 * @param {string} [payload.limit] - The limit for the conversations resultset
 * @param {string} [payload.offset] - The offset for the conversation resultset
 * @param {String} [payload.include] - The resources to directly include
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listConversations
 * @return {external:Promise.<Conversation[]>} {@link module:modules/chat~Conversation} -
 */
const listConversations = async (payload, message) => {
  logger.info('Listing conversations', { payload, message });

  const includes = impl.hasInclude(payload.include);
  const [conversations, objects] = await Promise.all([
    conversationRepo.findByIds(payload.conversationIds,
      createOptions(R.merge(payload, { order: [['updated_at', 'DESC']] }))),
    objectRepository.findBy({
      parentType: 'conversation', parentId: { $in: payload.conversationIds } }),
  ]);

  if (objects.length === 0) return conversations;

  const lastMessageObjects = lastMessageObjectsByConversationId(objects);
  const objectIds = R.pipe(R.pluck('id'), R.values)(lastMessageObjects);
  const lastMessages = await objectService.listWithSourceAndChildren({ objectIds }, message);

  const lastMessagesForConversation = R.map(object =>
    R.find(R.propEq('sourceId', object.sourceId), lastMessages), lastMessageObjects);

  if (includes('participants')) {
    const participants = await R.pipe(
      pluckUniqueParticipantIds, userRepository.findByIds)(conversations);
    const findParticipant = (participantId) => findIdEq(participantId, participants);

    return R.map(conversation => R.merge(conversation, {
      lastMessage: lastMessagesForConversation[conversation.id],
      participants: R.map(findParticipant, conversation.participantIds),
    }), conversations);
  }

  return R.map(conversation => R.merge(conversation, {
    lastMessage: lastMessagesForConversation[conversation.id] }), conversations);
};

/**
 * Retrieve a specific conversation
 * @param {string} conversationId - Id of the conversation
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getConversation
 * @return {external:Promise.<Conversation>} {@link module:modules/chat~Conversation}
 */
const getConversation = async(payload, message) => {
  logger.info('Get conversation', { payload, message });

  const conversations = await listConversations({
    conversationIds: [payload.conversationId], limit: 1 });
  const conversation = R.head(conversations);

  if (!conversation) throw createError('404');
  if (!R.contains(message.credentials.id, conversation.participantIds)) throw createError('404');

  return conversation;
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
const listConversationsForUser = async (payload, message) => {
  logger.info('Listing conversations for user', { payload, message });

  const conversationIds = await conversationRepo.findIdsForUser(payload.userId);

  return listConversations(R.merge({ conversationIds }, payload), message);
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
const listMessages = async (payload, message) => {
  logger.info('List messages for conversation', { payload, message });

  await impl.assertThatUserIsPartOfTheConversation(message.credentials.id, payload.conversationId);

  const objects = await objectService.list(R.merge(
    createOptions(payload),
    {
      parentType: 'conversation',
      parentId: payload.conversationId,
    }), message);

  return objectService.listWithSourceAndChildren({ objectIds: R.pluck('id', objects) }, message);
};

/**
 * Get conversation count for user to use for pagination data.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.userId - The id of the user
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method countConversations
 * @return {external:Promise<Number>}
 */
async function countConversations(payload, message) {
  logger.info('Count conversation', { payload, message });

  return conversationRepo.countConversationsForUser(payload.userId);
}

/**
 * Delete a conversation
 * @param {object} payload - Object containing payload data
 * @param {string} payload.conversationId - The type of parent to create the object for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method createMessage
 * @return {external:Promise<Message>} {@link module:chat~Message message}
 */
const remove = async (payload, message) => {
  logger.info('Deleting conversation', { payload, message });

  return Promise.all([
    conversationRepoV1.deleteConversationById(payload.conversationId),
    objectService.remove({
      parentType: 'conversation',
      parentId: payload.conversationId,
    }, message),
  ]);
};

/**
 * Get messages count for conversation to use for pagination data.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.conversationId - The id of the conversation
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method countMessages
 * @return {external:Promise<Number>}
 */
async function countMessages(payload, message) {
  logger.info('Count messages for conversation', { payload, message });

  await impl.assertThatUserIsPartOfTheConversation(message.credentials.id, payload.conversationId);

  return objectService.count({
    parentType: 'conversation',
    parentId: payload.conversationId,
    objectType: 'private_message',
  });
}

module.exports.countConversations = countConversations;
module.exports.countMessages = countMessages;
module.exports.create = create;
module.exports.getConversation = getConversation;
module.exports.listConversations = listConversations;
module.exports.listConversationsForUser = listConversationsForUser;
module.exports.listMessages = listMessages;
module.exports.remove = remove;
