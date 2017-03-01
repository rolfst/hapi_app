import R from 'ramda';
import * as Storage from '../../../../shared/services/storage';
import * as Logger from '../../../../shared/services/logger';
import createError from '../../../../shared/utils/create-error';
import * as attachmentRepo from '../../repositories/attachment';

/**
 * @module modules/attachment/services/attachment
 */

const logger = Logger.getLogger('attachment/service/attachment');

/**
 * Lists selected attachments
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.attachmentIds - Ids of the attachments to get
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method list
 * @return {external:Promise.<Attachment[]>} {@link
 * module:modules/attachment~Attachment Attachment}
 */
export const list = async (payload, message) => {
  logger.info('Finding multiple attachments', { payload, message });

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
export const get = async (payload, message) => {
  logger.info('Finding attachment', { payload, message });
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
export const update = async (payload, message) => {
  logger.info('Updating attachment', { payload, message });
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
export const create = async (payload, message) => {
  logger.info('Creating attachment', { payload: R.omit(['fileStream'], payload), message });

  const path = await Storage.upload(payload.fileStream, 'attachments');

  return attachmentRepo.create(path);
};

export const assertAttachmentsExist = async (payload, message) => {
  const attachments = await list({ attachmentIds: payload.attachmentIds }, message);

  if (attachments.length !== payload.attachmentIds.length) {
    throw createError('403', 'Please provide valid attachment ids');
  }
};
