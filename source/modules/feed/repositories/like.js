const R = require('ramda');
const { Like } = require('./dao');
const createLikeModel = require('../models/like');

/**
 * Find likes by where constraint
 * @param {string} whereConstraint - The where constraint
 * @method findBy
 * @return {external:Promise.<Like[]>} {@link module:modules/feed~Like}
 */
const findBy = async (whereConstraint) => Like
  .findAll({ where: whereConstraint })
  .then(R.map(createLikeModel));

/**
 * Create a like
 * @param {string[]} messageId - The id of the message
 * @param {string} userId - The id of the user
 * @method create
 * @return {external:Promise.<Like>} {@link module:modules/feed~Like}
 */
const create = async (messageId, userId) => Like
  .create({ messageId, userId })
  .then(createLikeModel);

/**
 * Deletes a like
 * @param {string} messageId - The id of the message
 * @param {string} userId - The id of the user
 * @method remove
 * @return {external:Promise}
 */
const remove = async (messageId, userId) => Like
  .destroy({ where: { messageId, userId } });

// exports of functions
module.export = {
  create,
  findBy,
  remove,
};
