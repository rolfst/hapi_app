import R from 'ramda';
import { _Object } from './dao';
import createDomainObject from '../models/object';

/**
 * Creating an object
 * @param {object} attributes - Object containing the attributes
 * @param {string} attributes.userId - The id that instantiated the object
 * @param {string} attributes.parentType - The type of parent to get objects for
 * @param {string} attributes.parentId - The id of the parent
 * @param {string} attributes.objectType - The type of object
 * @param {string} attributes.sourceId - The id that refers to the activity
 * @method create
 * @return {external:Promise.<Object>} {@link module:modules/feed~Object}
 */
export const create = async (attributes) => {
  const whitelist = ['userId', 'parentType', 'parentId', 'objectType', 'sourceId'];
  const result = await _Object.create(R.pick(whitelist, attributes));

  return createDomainObject(result);
};

/**
 * Find objects by where constraint
 * @param {object} whereConstraint - Object containing a where constraint
 * @param {object} options - Object containing options
 * @param {string} options.offset - The offset of the resultset
 * @param {string} options.limit - The limit of the resultset
 * @method findBy
 * @return {external:Promise.<Object[]>} {@link module:modules/feed~Object}
 */
export const findBy = async (whereConstraint, options) => {
  const result = await _Object.findAll({
    ...options,
    where: whereConstraint,
  });

  return R.map(createDomainObject, result);
};

/**
 * Delete objects by where constraint
 * @param {object} whereConstraint - Object containing a where constraint
 * @method deleteBy
 * @return {boolean}
 */
export const deleteBy = async (whereConstraint) => {
  await _Object.destroy({ where: whereConstraint });

  return true;
};

/**
 * Count objects by where constraint
 * @param {object} whereConstraint - Object containing a where constraint
 * @method count
 * @return {boolean}
 */
export const count = async (whereConstraint) => {
  return _Object.count({ where: whereConstraint });
};

/**
 * Deletes an object by id
 * @param {string} - identifier for the object to delete
 * @method deleteById
 * @return {boolean}
 */
export function deleteById(id) {
  return deleteBy({ id });
}

/**
 * Internal function
 * @method findAll
 * return {external:Promise.<Object[]>} {@link module:modules/feed~Object Object}
 */
export function findAll() {
  return _Object.findAll();
}
