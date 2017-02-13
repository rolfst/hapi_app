import R from 'ramda';
import Promise from 'bluebird';
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

  return attachment;
};

async function storeAttachments(uploadPaths) {
  return Promise.map(uploadPaths, attachmentRepo.create);
}

const toStorage = async (message, uploads) => { return uploadService.upload(uploads, message); };
const upload = R.curry(toStorage);
/**
 * Creates a attachment
 * @param {object} payload - Object containing payload data
 * @param {Upload[]} payload.uploads - Array of uploaded Attachment
 * {@link module:modules/attachment~Upload Upload}
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Attachment[]>} {@link module:modules/attachment~Attachment Attachment}
 */
export const create = async (payload, message) => {
  logger.info('Creating attachment', { payload, message });

  const uploads = R.map(createAttachmentUpload, payload.uploads);
  const uploadToStorage = upload(message);

  return Promise.map(uploads, uploadToStorage)
    .then(storeAttachments);
};

export const update = async (payload, message) => {
  logger.info('Updating attachment', { payload, message });

  return Promise.map(payload.attachments, attachmentRepo.update);
};
