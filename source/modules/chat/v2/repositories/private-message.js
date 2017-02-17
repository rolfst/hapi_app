import R from 'ramda';
import createPrivateMessageModel from '../models/private-message';
import { PrivateMessage } from './dao';

export const findBy = (whereConstraint) => PrivateMessage
  .findAll({ where: whereConstraint })
  .then(R.map(createPrivateMessageModel));

export const findByIds = (messageIds) => findBy({
  id: { $in: messageIds },
});

export const findById = (messageId) => PrivateMessage
  .findOne({ where: { id: messageId } })
  .then(createPrivateMessageModel);

export const create = ({ objectId, text }) => PrivateMessage
  .create({ objectId, text })
  .then(createPrivateMessageModel);

export const update = (messageId, attributes) => PrivateMessage
  .update(attributes, { where: { id: messageId } });
