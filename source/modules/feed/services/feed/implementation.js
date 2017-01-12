import R from 'ramda';
import * as flexchangeService from '../../../flexchange/services/flexchange';
import * as messageService from '../message';
import createFeedModel from '../../models/feed';

const findLink = (object, lookup) => R.find(R.whereEq({ objectId: object.id }), lookup);
const findById = (id, collection) => R.find(R.whereEq({ id }), collection);
const typeEq = R.propEq('type');
const reduceToValuesBy = R.reduceBy((acc, object) =>
  acc.concat({ objectId: object.id, sourceId: object.sourceId }), []);
const createTypeValuePair = R.mapObjIndexed((values, key) => ({ type: key, values }));
const removeDuplicatedValues = R.over(R.lensProp('values'), R.uniq);

/**
 * Create flattened object with unique type values pairs from objects
 * @param {Object[]} objects - The objects to flatten
 * @method createFeedAST
 * @return {object}
 */
export const createObjectSourceLinks = (objects) => R.pipe(
  reduceToValuesBy(R.prop('objectType')),
  createTypeValuePair,
  R.values,
  R.map(removeDuplicatedValues)
)(objects);

export const findSourcesForFeed = R.curry((message, flattenedObject) => R.cond([
  [typeEq('message'), (obj) => {
    const results = messageService.list({
      messageIds: R.pluck('sourceId', obj.values) }, message);

    return { ...obj, values: results };
  }],
  [typeEq('exchange'), (obj) => {
    const results = flexchangeService.list({
      exchangeIds: R.pluck('sourceId', obj.values) }, message);

    return { ...obj, values: results };
  }],
])(flattenedObject));

export const mergeSourceAndObject = (objects, links, sources) => R.map(obj => {
  const link = findLink(obj, links);
  const sourceMatch = findById(link.sourceId, sources);

  return createFeedModel({ ...obj, source: sourceMatch });
}, objects);
