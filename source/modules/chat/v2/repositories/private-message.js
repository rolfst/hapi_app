import R from 'ramda';
import createPrivateMessageModel from '../models/private-message';
import { PrivateMessage } from './dao';

export const findBy = (whereConstraint) => PrivateMessage
  .findAll({ where: whereConstraint })
  .then(R.map(createPrivateMessageModel));

export const create = ({ objectId, text }) => PrivateMessage
  .create({ objectId, text })
  .then(createPrivateMessageModel);

export const update = (messageId, attributes) => PrivateMessage
  .update(attributes, { where: { id: messageId } });
