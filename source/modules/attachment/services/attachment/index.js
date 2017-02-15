import * as Logger from '../../../../shared/services/logger';
import { createError } from '../../../../shared/utils/create-error';
import * as uploadService from '../../../upload/services/upload';
import * as attachmentRepo from '../../repositories/attachment';
import * as impl from './implementation';

/**
 * @module modules/attachment/services/attachment
 */

const logger = Logger.getLogger('attachment/service/attachment');

/**
 * Gets a attachment
 * @param {object} payload - Object containing payload data
 * @param {string} payload.attachmentId - Id of the attachment to get
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method get
 * @return {external:Promise.<attachment>}
 */
export const get = async (payload, message) => {
  logger.info('Finding attachment', { payload, message });
  const attachment = await attachmentRepo.findById(payload.attachmentId);

  if (!attachment) createError('404');

  return attachment;
};

/**
 * Creates a attachment
 * @param {object} payload - Object containing payload data
 * @param {Upload} payload.upload - uploaded Attachment
 * {@link module:modules/attachment~Upload Upload}
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Attachment>} {@link module:modules/attachment~Attachment Attachment}
 */
export const create = (payload, message) => {
  logger.info('Creating attachment', { payload, message });

  const upload = impl.createAttachmentUpload(payload.upload);

  return uploadService.upload(upload, message)
    .then(attachmentRepo.create);
};

export const update = async (payload, message) => {
  logger.info('Updating attachment', { payload, message });
  const attachment = await attachmentRepo.findById(payload.attachment.id);
  if (!attachment) createError('404');

  return attachmentRepo.update(payload.attachment);
};
