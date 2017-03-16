const R = require('ramda');
const createPrivateMessageModel = require('../models/private-message');
const { PrivateMessage } = require('./dao');

export const findBy = (whereConstraint) => PrivateMessage
  .findAll({ where: whereConstraint })
  .then(R.map(createPrivateMessageModel));

export const findByIds = (messageIds) => findBy({
  id: { $in: messageIds },
});

export const findById = (messageId) => PrivateMessage
  .findOne({ where: { id: messageId } })
  .then(createPrivateMessageModel);

export const create = ({ userId, objectId, text }) => PrivateMessage
  .create({ userId, objectId, text })
  .then(createPrivateMessageModel);

export const update = (messageId, attributes) => PrivateMessage
  .update(attributes, { where: { id: messageId } });
