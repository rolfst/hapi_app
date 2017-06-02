const R = require('ramda');
const { Comment } = require('./dao');
const createCommentModel = require('../models/comment');

/**
 * Find comments by where constraint
 * @param {string} whereConstraint - The where constraint
 * @method findBy
 * @return {external:Promise.<Comment[]>} {@link module:modules/feed~Comment}
 */
const findBy = async (whereConstraint) => Comment
  .findAll({ where: whereConstraint })
  .then(R.map(createCommentModel));

/**
 * Creates a comment
 * @param {string} attributes - The attributes to save
 * @method create
 * @return {external:Promise.<Comment>} {@link module:modules/feed~Comment}
 */
const create = async (attributes) => Comment
  .create(attributes)
  .then(createCommentModel);

const deleteAll = () => Comment.findAll()
  .then((comments) => Comment.destroy({
    where: { id: { $in: R.pluck('id', comments) } },
  }));

exports.create = create;
exports.findBy = findBy;
exports.deleteAll = deleteAll;
