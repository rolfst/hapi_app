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
export const findWhereType = (type, collection) => R.find(R.whereEq({ type }), collection);
export const objectsForType = (type, collection) =>
  R.filter(R.whereEq({ objectType: type }), collection);

/**
 * Create flattened object with unique type values pairs from objects
 * @param {Object[]} objects - The objects to flatten
 * @method createObjectSourceLinks
 * @return {object}
 */
export const createObjectSourceLinks = (objects) => R.pipe(
  reduceToValuesBy(R.prop('objectType')),
  createTypeValuePair,
  R.values,
  R.map(removeDuplicatedValues)
)(objects);

/**
 * Find the sources for the object.
 * @param {object} message {@link module:shared~Message message} - Object containing meta data
 * @param {object[]} objectSourceLink - The link to find the values with source ids
 * @method findSourcesForFeed
 * @return {object}
 */
export const findSourcesForFeed = R.curry((message, objectSourceLink) => R.cond([
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
])(objectSourceLink));

/**
 * Create flattened object with unique type values pairs from objects
 * @param {object[]} objects - The objects to merge the source in
 * @param {object[]} links - The link lookup to find the link for an object containing the sourceId
 * @param {object[]} sources - The source lookup to find the source that belongs to the object
 * @method mergeSourceAndObject
 * @return {object[]}
 */
export const mergeSourceAndObject = (objects, links, sources) => R.map(obj => {
  const link = findLink(obj, links);
  const sourceMatch = findById(link.sourceId, sources);

  return createFeedModel({ ...obj, source: sourceMatch });
}, objects);
