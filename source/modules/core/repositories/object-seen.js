const R = require('ramda');
const Sequelize = require('sequelize');
const { ObjectSeen } = require('./dao');
const createDomainObject = require('../models/object-seen');

/**
 * Creating an object
 * @param {object} attributes - Object containing the attributes
 * @param {string} attributes.userId - The id of the user that viewed the object
 * @param {string} attributes.objectId - The id of object that has been viewed
 * @param {object} opts - Options directly passed to the model
 * @method create
 * @return {external:Promise.<Object>} {@link module:modules/feed~Object}
 */
const create = async (attributes, opts = {}) => {
  const whitelist = ['userId', 'objectId'];
  const result = await ObjectSeen.create(R.pick(whitelist, attributes), opts);

  return createDomainObject(result);
};

/**
 * Find objects by where constraint
 * @param {object} whereConstraint - Object containing a where constraint
 * @param {object} options - Object containing options
 * @param {string} options.offset - The offset of the result set
 * @param {string} options.limit - The limit of the result set
 * @param {string} options.order - The order of the result set
 * @method findBy
 * @return {external:Promise.<Object[]>} {@link module:modules/feed~Object}
 */
const findBy = async (whereConstraint, options) => {
  const result = await ObjectSeen.findAll(R.merge(options,
    { where: whereConstraint }));

  return R.map(createDomainObject, result);
};

/**
 * Find seen counts for specific objects
 * @param {array<objectId>} objectids - Array with the ids of objects to retrieve seen counts for
 * @method findSeenCountsForObjects
 * @return {external:Promise.<Object[]>} {@link TODO - add definition}
 */
const findSeenCountsForObjects = (objectIds) => {
  return findBy({
    objectId: { $in: objectIds },
  }, {
    attributes: [
      'objectId',
      [Sequelize.fn('COUNT', Sequelize.col('object_id')), 'seenCount']],
    group: ['objectId'],
  });
};

const findObjectsSeenByUser = (objectIds, userId) => {
  return findBy({
    objectId: { $in: objectIds },
    userId,
  });
};

const deleteAll = () => ObjectSeen.findAll()
  .then((ids) => ObjectSeen.destroy({
    where: { id: { $in: R.pluck('id', ids) } },
  }));

exports.create = create;
exports.deleteAll = deleteAll;
exports.findBy = findBy;
exports.findObjectsSeenByUser = findObjectsSeenByUser;
exports.findSeenCountsForObjects = findSeenCountsForObjects;
