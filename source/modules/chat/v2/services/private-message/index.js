const R = require('ramda');
const Promise = require('bluebird');
const createError = require('../../../../../shared/utils/create-error');
const attachmentService = require('../../../../attachment/services/attachment');
const attachmentDefinitions = require('../../../../attachment/definitions');
const objectService = require('../../../../core/services/object');
const privateMessageRepository = require('../../repositories/private-message');
const conversationRepository = require('../../repositories/conversation');
const ChatDispatcher = require('../../dispatcher');

const logger = require('../../../../../shared/services/logger')('CHAT/service/conversation');

/**
 * Listing private messages
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.messageIds - The ids of the messages to list
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method list
 * @return {external:Promise.<PrivateMessage[]>} {@link module:modules/chat~PrivateMessage}
 */
const list = async (payload, message) => {
  logger.debug('Listing private messages', { payload, message });

  return privateMessageRepository.findByIds(payload.messageIds);
};

/**
 * Create private message
 * @param {object} payload - Object containing payload data
 * @param {string} payload.conversationId - The id of the conversation the message is created in.
 * @param {string[]} payload.text - The text of the message
 * @param {object} payload.files - Id of the attachments to associate to the private message
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<PrivateMessage>} {@link module:modules/chat~PrivateMessage}
 */
async function create(payload, message) {
  logger.debug('Creating private message', { payload, message });

  const conversation = await conversationRepository.findById(payload.conversationId);
  if (!conversation) throw createError('404');

  const createObjectPayload = (createdMessage) => ({
    networkId: null,
    userId: message.credentials.id,
    parentType: 'conversation',
    parentId: payload.conversationId,
    objectType: 'private_message',
    sourceId: createdMessage.id,
  });

  const createdMessage = await privateMessageRepository.create({
    userId: message.credentials.id, objectId: null, text: payload.text });

  if (payload.files) {
    await attachmentService.assertAttachmentsExist({ attachmentIds: payload.files }, message);

    await Promise.map(R.flatten([payload.files]), (attachmentId) => attachmentService.update({
      whereConstraint: { id: attachmentId },
      attributes: {
        parentType: attachmentDefinitions.EParentTypes.PRIVATE_MESSAGE,
        parentId: createdMessage.id,
      },
    }, message));
  }

  const createdObject = await objectService.create(createObjectPayload(createdMessage));
  await privateMessageRepository.update(createdMessage.id, { objectId: createdObject.id });
  const output = await objectService.getWithSourceAndChildren({ objectId: createdObject.id });

  await conversationRepository.update(payload.conversationId, { updatedAt: new Date() });

  ChatDispatcher.emit('message.created', {
    conversation,
    object: output,
    token: message.artifacts && message.artifacts.authenticationToken,
  });

  return output;
}

exports.create = create;
exports.list = list;
