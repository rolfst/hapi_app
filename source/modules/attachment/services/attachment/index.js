const R = require('ramda');
const Storage = require('../../../../shared/services/storage');
const createError = require('../../../../shared/utils/create-error');
const attachmentRepo = require('../../repositories/attachment');

/**
 * @module modules/attachment/services/attachment
 */

const logger = require('../../../../shared/services/logger')('attachment/service/attachment');

/**
 * Lists selected attachments
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.attachmentIds - Ids of the attachments to get
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method list
 * @return {external:Promise.<Attachment[]>} {@link
 * module:modules/attachment~Attachment Attachment}
 */
const list = async (payload, message) => {
  logger.debug('Finding multiple attachments', { payload, message });

  return attachmentRepo.findBy({ id: { $in: payload.attachmentIds } });
};

/**
 * Gets a attachment
 * @param {object} payload - Object containing payload data
 * @param {string} payload.whereConstraint - The where constraint to find attachment
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method get
 * @return {external:Promise.<attachment>} {@link module:modules/attachment~Attachment Attachment}
 */
const get = async (payload, message) => {
  logger.debug('Finding attachment', { payload, message });
  const attachment = R.head(await attachmentRepo.findBy(payload.whereConstraint));

  if (!attachment) throw createError('404');

  return attachment;
};

/**
 * Updates an attachment
 * @param {object} payload - Object containing payload data
 * @param {string} payload.whereConstraint - Id of the attachment to update
 * @param {string} payload.attributes - Attributes to update
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method get
 * @return {external:Promise.<attachment>} {@link module:modules/attachment~Attachment Attachment}
 */
const update = async (payload, message) => {
  logger.debug('Updating attachment', { payload, message });
  const attachment = await get({ whereConstraint: payload.whereConstraint });

  return attachmentRepo.update(R.merge({ id: attachment.id }, payload.attributes));
};

/**
 * Creates a attachment
 * @param {object} payload - Object containing payload data
 * @param {Stream} payload.fileStream - The file to upload
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @example
 * const attachment = await attachmentService.create({...
 * const objResource = await objectService.create({...
 * const attachment = Object.assign({}, attachment, objResource);
 * const updatedAttachment = await attachmentService.update({ attachment }...
 * @method create
 * @return {external:Promise.<Attachment>} {@link module:modules/attachment~Attachment Attachment}
 */
const create = async (payload, message) => {
  logger.debug('Create attachment', { payload: R.omit(['fileStream'], payload), message });

  if (!payload.fileStream || typeof payload.fileStream.on !== 'function') {
    throw createError('422', 'Please provide a file.');
  }

  const path = await Storage.upload(payload.fileStream, 'attachments');

  return attachmentRepo.create(path);
};

/**
 * Assert if attachments exists
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.attachmentIds - Ids of the attachments to assert
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method assertAttachmentsExist
 * @throws 403 Error
 * @return {void}
 */
const assertAttachmentsExist = async (payload, message) => {
  const attachments = await list({ attachmentIds: payload.attachmentIds }, message);

  if (attachments.length !== payload.attachmentIds.length) {
    throw createError('403', 'Please provide valid attachment ids');
  }
};

exports.assertAttachmentsExist = assertAttachmentsExist;
exports.create = create;
exports.get = get;
exports.list = list;
exports.update = update;
