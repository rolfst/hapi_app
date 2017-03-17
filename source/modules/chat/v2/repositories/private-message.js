const R = require('ramda');
const createPrivateMessageModel = require('../models/private-message');
const { PrivateMessage } = require('./dao');

const findBy = (whereConstraint) => PrivateMessage
  .findAll({ where: whereConstraint })
  .then(R.map(createPrivateMessageModel));

const findByIds = (messageIds) => findBy({
  id: { $in: messageIds },
});

const findById = (messageId) => PrivateMessage
  .findOne({ where: { id: messageId } })
  .then(createPrivateMessageModel);

const create = ({ userId, objectId, text }) => PrivateMessage
  .create({ userId, objectId, text })
  .then(createPrivateMessageModel);

const update = (messageId, attributes) => PrivateMessage
  .update(attributes, { where: { id: messageId } });

// exports of functions
module.export = {
  create,
  findBy,
  findById,
  update,
};
