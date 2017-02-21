import R from 'ramda';
import { Attachment } from './dao';
import createAttachmentModel from '../models/attachment';

/**
 * @module modules/attachment/repositories/attachment
 */

/**
 * Find attachments by where constraint
 * @param {object} whereConstraint - The where constraint
 * @method findBy
 * @return {external:Promise.<Attachment[]>} {@link module:modules/attachment~Attachment}
 */
export const findBy = (whereConstraint) => Attachment
  .findAll({ where: whereConstraint })
  .then(R.map(createAttachmentModel));

/**
 * Find a specific attachment by id
 * @param {string} id - Id of the attachment
 * @method findById
 * @return {external:Promise.<Attachment>} - Find attachment promise
 */
export const findById = (id) => Attachment
  .findById(id)
  .then(R.ifElse(R.isNil, R.always(null), createAttachmentModel));

/**
 * Create a new attachment
 * @param {string} path - Attachment attributes
 * @method create
 * @return {external:Promise.<Attachment>} - Create attachment promise
 */
export const create = (messageId, path) => Attachment
  .create({ messageId, path })
  .then(createAttachmentModel)
  .catch(R.always(null));

export const deleteById = (attachmentId) => Attachment
  .destroy({ where: { id: attachmentId } });

/**
 * Updates an attachment
 * @param {Attachment} attachment - {@link module:modules/attachment~Attachment Attachment}
 * @method update
 * @return {external:Promise.<Attachment>} - Create attachment promise
 */
export const update = (attachment) => Attachment
  .update(R.omit(['id'], attachment), {
    where: { id: attachment.id },
  })
  .then(R.always(attachment));
