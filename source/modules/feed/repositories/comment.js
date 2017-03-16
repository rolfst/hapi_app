const R = require('ramda');
const { Comment } = require('./dao');
const createCommentModel = require('../models/comment');

/**
 * Find comments by where constraint
 * @param {string} whereConstraint - The where constraint
 * @method findBy
 * @return {external:Promise.<Comment[]>} {@link module:modules/feed~Comment}
 */
export const findBy = async (whereConstraint) => Comment
  .findAll({ where: whereConstraint })
  .then(R.map(createCommentModel));

/**
 * Creates a comment
 * @param {string} attributes - The attributes to save
 * @method create
 * @return {external:Promise.<Comment>} {@link module:modules/feed~Comment}
 */
export const create = async (attributes) => Comment
  .create(attributes)
  .then(createCommentModel);
