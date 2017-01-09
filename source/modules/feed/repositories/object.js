import { map } from 'ramda';
import { _Object } from '../data-models';
import createDomainObject from '../domain-objects/object';

/**
 * Creating an object
 * @param {object} attributes - Object containing the attributes
 * @method create
 * @return {Object}
 */
export const create = async (attributes) => {
  const result = await _Object.create(attributes);

  return createDomainObject(result);
};

/**
 * Find objects by where constraint
 * @param {object} attributes - Object containing the attributes
 * @method findBy
 * @return {Object[]}
 */
export const findBy = async (whereConstraint) => {
  const result = await _Object.findAll({ where: whereConstraint });

  return map(createDomainObject, result);
};
