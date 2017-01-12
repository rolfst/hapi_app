import R, { map, pluck, pick } from 'ramda';
import Promise from 'bluebird';
import * as Logger from '../../../../shared/services/logger';
import * as objectService from '../object';
import * as impl from './implementation';

/**
 * @module modules/feed/services/object
 */

const logger = Logger.getLogger('FEED/service/feed');

/**
 * Making a feed for a parent
 * @param {object} payload - Object containing payload data
 * @param {string} payload.parentType - The type of parent to get objects for
 * @param {string} payload.parentId - The id of the parent
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method make
 * @return {external:Promise.<Mixed[]>}
 */
export const make = async (payload, message) => {
  logger.info(`Making feed for ${payload.parentType}`, { payload, message });

  const relatedObjects = await objectService.list(
    pick(['parentType', 'parentId'], payload), message);

  const findWhereType = (type, collection) => R.find(R.whereEq({ type }), collection);
  const objectsForType = (type) => R.filter(R.whereEq({ objectType: type }), relatedObjects);

  // Gathering the data to build the feed
  const feedAST = impl.createObjectSourceLinks(relatedObjects);
  const promisedSources = map(impl.findSourcesForFeed(message), feedAST);
  const sources = await Promise.map(promisedSources, Promise.props);
  const occurringTypes = pluck('type', feedAST);

  // Linking everything together
  return R.chain(occurringType => {
    const sourcesForType = findWhereType(occurringType, sources);
    const linksForType = findWhereType(occurringType, feedAST);

    return impl.mergeSourceAndObject(
      objectsForType(occurringType),
      linksForType.values,
      sourcesForType.values);
  }, occurringTypes);
};
