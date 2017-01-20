import R from 'ramda';
import { _Object } from './dao';
import createDomainObject from '../models/object';

/**
 * Creating an object
 * @param {object} attributes - Object containing the attributes
 * @method create
 * @return {Object} {@link module:feed~Object object}
 */
export const create = async (attributes) => {
  const result = await _Object.create(attributes);

  return createDomainObject(result);
};

/**
 * Find objects by where constraint
 * @param {object} attributes - Object containing the attributes
 * @method findBy
 * @return {Object[]} {@link module:feed~Object object}
 */
export const findBy = async (whereConstraint) => {
  const result = await _Object.findAll({ where: whereConstraint });

  return R.map(createDomainObject, result);
};
