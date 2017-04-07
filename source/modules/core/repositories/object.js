const R = require('ramda');
const { _Object } = require('./dao');
const createDomainObject = require('../models/object');
const objectSeenRepository = require('./objectseen');

/**
 * Creating an object
 * @param {object} attributes - Object containing the attributes
 * @param {string} attributes.userId - The id that instantiated the object
 * @param {string} attributes.networkId - The network where the object is created for
 * @param {string} attributes.parentType - The type of parent to get objects for
 * @param {string} attributes.parentId - The id of the parent
 * @param {string} attributes.objectType - The type of object
 * @param {string} attributes.sourceId - The id that refers to the activity
 * @method create
 * @return {external:Promise.<Object>} {@link module:modules/feed~Object}
 */
const create = async (attributes) => {
  const whitelist = ['userId', 'networkId', 'parentType', 'parentId', 'objectType', 'sourceId'];
  const result = await _Object.create(R.pick(whitelist, attributes));

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
  const result = await _Object.findAll(R.merge(options,
        { where: whereConstraint }));

  const seenCounts = await objectSeenRepository.findSeenCountsForObjects(R.pluck('id', result));

  const findSeenCount = (object) =>
    R.propOr(0, 'seenCount', R.find(R.propEq('objectId', object.id), seenCounts));
  const addSeenCount = (object) =>
    R.assoc('seenCount', findSeenCount(object), object);

  return R.map(R.pipe(createDomainObject, addSeenCount), result);
};

/**
 * Delete objects by where constraint
 * @param {object} whereConstraint - Object containing a where constraint
 * @method deleteBy
 * @return {boolean}
 */
const deleteBy = async (whereConstraint) => {
  await _Object.destroy({ where: whereConstraint });

  return true;
};

/**
 * Count objects by where constraint
 * @param {object} whereConstraint - Object containing a where constraint
 * @method count
 * @return {boolean}
 */
const count = async (whereConstraint) => {
  return _Object.count({ where: whereConstraint });
};

/**
 * Update a single object
 * @param {string} objectId - The id of the object to update
 * @param {object} attributes - The attributes to update
 * @method update
 * @return {boolean}
 */
const update = async (objectId, attributes) => _Object
  .update(attributes, { where: { id: objectId } });

/**
 * Deletes an object by id
 * @param {string} - identifier for the object to delete
 * @method deleteById
 * @return {boolean}
 */
function deleteById(id) {
  return deleteBy({ id });
}

/**
 * Internal function
 * @method findAll
 * return {external:Promise.<Object[]>} {@link module:modules/feed~Object Object}
 */
function findAll() {
  return _Object.findAll();
}

exports.count = count;
exports.create = create;
exports.deleteBy = deleteBy;
exports.deleteById = deleteById;
exports.findAll = findAll;
exports.findBy = findBy;
exports.update = update;
