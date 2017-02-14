import R from 'ramda';
import * as Logger from '../../../../shared/services/logger';
import * as uploadService from '../../../upload/services/upload';
import * as attachmentRepo from '../../repositories/attachment';

/**
 * @module modules/attachment/services/attachment
 */

const logger = Logger.getLogger('attachment/service/attachment');
const createAttachmentUpload = (upload) => ({ name: `/attachment/${upload.name}`,
  stream: upload.stream });

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
 * @param {string} payload.attachmentId - Id of the attachment to get
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method get
 * @return {external:Promise.<attachment>} {@link module:modules/attachment~Attachment Attachment}
 */
export const get = async (payload, message) => {
  logger.info('Finding attachment', { payload, message });
  const attachment = await attachmentRepo.findById(payload.attachmentId);

  return attachment;
};

const toStorage = async (message, uploads) => { return uploadService.upload(uploads, message); };
const uploadAttachment = R.curry(toStorage);
/**
 * Creates a attachment
 * @param {object} payload - Object containing payload data
 * @param {Upload} payload.upload - uploaded Attachment
 * {@link module:modules/attachment~Upload Upload}
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
  logger.info('Creating attachment', { payload, message });

  const upload = createAttachmentUpload(payload.upload);
  const uploadToStorage = uploadAttachment(message);

  return uploadToStorage(upload)
    .then(attachmentRepo.create);
};

export const update = async (payload, message) => {
  logger.info('Updating attachment', { payload, message });

  return attachmentRepo.update(payload.attachment);
};
