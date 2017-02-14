import R from 'ramda';
import { Attachment } from './dao';
import createAttachmentModel from '../models/attachment';

/**
 * @module modules/attachment/repositories/attachment
 */

/**
 * Internal function
 * @return {external:Promise.<Attachment[]>} {@link module:modules/attachment~Attachment
 * Attachment}
 */
export const findAll = async () => {
  const attachments = Attachment.findAll();

  return R.map(createAttachmentModel, attachments);
};

/**
 * Find a specific attachment by id
 * @param {string} id - Id of the attachment
 * @method findAttachmentById
 * @return {external:Promise.<Attachment>} - Find attachment promise
 */
export const findById = async (id) => {
  const attachment = await Attachment.findById(id);

  if (!attachment) return null;

  return createAttachmentModel(attachment);
};

/**
 * Create a new attachment
 * @param {string} path - Attachment attributes
 * @method create
 * @return {external:Promise.<Attachment>} - Create attachment promise
 */
export const create = async (path) => {
  const attachment = await Attachment.create({ path });

  return createAttachmentModel(attachment);
};

/**
 * Updates an attachment
 * @param {Attachment} attachment - {@link module:modules/attachment~Attachment Attachment}
 * @method update
 * @return {external:Promise.<Attachment>} - Create attachment promise
 */
export const update = async (attachment) => {
  const updatedAttachment = await Attachment.findById(attachment.id)
    .then(pivot => pivot.update(attachment));

  return createAttachmentModel(updatedAttachment);
};

export const deleteById = async (attachmentId) => {
  return Attachment.destroy({ where: { id: attachmentId } });
};
