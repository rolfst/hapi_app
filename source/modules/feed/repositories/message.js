const R = require('ramda');
const { FeedMessage } = require('./dao');
const createFeedMessageModel = require('../models/message');

/**
 * Find a message by id
 * @param {string} messageId - The id of the message
 * @method findById
 * @return {external:Promise.<FeedMessage>} {@link module:modules/feed~FeedMessage}
 */
const findById = (messageId) => {
  return FeedMessage.findById(messageId)
    .then((message) => {
      if (!message) return null;

      return createFeedMessageModel(message);
    });
};

/**
 * Find messages by ids
 * @param {string[]} messageIds - The ids of the messages
 * @method findByIds
 * @return {external:Promise.<FeedMessage[]>} {@link module:modules/feed~FeedMessage}
 */
const findByIds = async (messageIds) => {
  const results = await FeedMessage.findAll({
    where: { id: { in: messageIds } },
  });

  return R.map(createFeedMessageModel, results);
};

/**
 * Creating a message
 * @param {object} attributes - Attributes for creating a message
 * @param {string} attributes.userId - The user id that creates the message
 * @param {string} attributes.text - The text that contains the message
 * @method create
 * @return {external:Promise.<FeedMessage>} {@link module:modules/feed~FeedMessage}
 */
const create = async (attributes) => {
  const attributesWhitelist = ['createdBy', 'text', 'parentType', 'parentId'];
  const result = await FeedMessage.create(R.pick(attributesWhitelist, attributes));

  return createFeedMessageModel(result);
};

/*
 * Updating a message
 * @param {string} attributes.text - The text that contains the message
 * @method update
 * @return {external:Promise.<FeedMessage>} {@link module:modules/feed~FeedMessage}
 */
const update = async (messageId, attributes) => {
  const result = await FeedMessage.findOne({
    where: { id: messageId },
  });
  const message = await result.update(attributes);

  return createFeedMessageModel(message);
};

const destroy = (messageId) => FeedMessage.destroy({ where: { id: messageId } });

exports.create = create;
exports.destroy = destroy;
exports.findById = findById;
exports.findByIds = findByIds;
exports.update = update;
