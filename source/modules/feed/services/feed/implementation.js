import R from 'ramda';

const reduceToValuesBy = R.reduceBy((acc, object) => acc.concat(object.sourceId), []);
const createTypeValuePair = R.mapObjIndexed((values, key) => ({ type: key, values }));
const removeDuplicatedValues = R.over(R.lensProp('values'), R.uniq);

/**
 * Create flattened object with unique type values pairs from objects
 * @param {Object[]} objects - The objects to flatten
 * @method flattenObjectTypeValues
 * @return {object}
 */
export const flattenObjectTypeValues = (objects) => R.pipe(
  reduceToValuesBy(R.prop('objectType')),
  createTypeValuePair,
  R.values,
  R.map(removeDuplicatedValues)
)(objects);
