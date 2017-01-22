import R from 'ramda';
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
 * @return {external:Promise.<Object>} {@link module:modules/feed~Object}
 */
export const make = async (payload, message) => {
  logger.info(`Making feed for ${payload.parentType}`, { payload, message });

  const relatedObjects = await objectService.list(
    R.pick(['parentType', 'parentId'], payload), message);

  // Gathering the data to build the feed
  const objectSourceLinks = impl.createObjectSourceLinks(relatedObjects);
  const promisedSources = R.map(impl.findSourcesForFeed(message), objectSourceLinks);
  const sources = await Promise.map(promisedSources, Promise.props);
  const occurringTypes = R.pluck('type', objectSourceLinks);

  // Linking everything together
  return R.chain(occurringType => {
    const sourcesForType = impl.findWhereType(occurringType, sources);
    const linksForType = impl.findWhereType(occurringType, objectSourceLinks);

    return impl.mergeSourceAndObject(
      impl.objectsForType(occurringType, relatedObjects),
      linksForType.values,
      sourcesForType.values);
  }, occurringTypes);
};
