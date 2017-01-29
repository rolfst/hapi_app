import R from 'ramda';
import Promise from 'bluebird';
import * as Logger from '../../../../shared/services/logger';
import * as objectRepository from '../../repositories/object';
import * as impl from './implementation';

/**
 * @module modules/feed/services/object
 */

const logger = Logger.getLogger('FEED/service/object');

/**
 * Listing objects for a specific parent
 * @param {object} payload - Object containing payload data
 * @param {string} payload.limit - The limit for pagination
 * @param {string} payload.offset - The offset for pagination
 * @param {string} payload.parentType - The type of parent to get objects for
 * @param {string} payload.parentId - The id of the parent
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method list
 * @return {external:Promise.<Object[]>} {@link module:modules/feed~Object}
 */
export const list = async (payload, message) => {
  logger.info('Listing objects', { payload, message });

  const options = R.pick(['offset', 'limit'], payload);
  const objects = await objectRepository.findBy({
    parentType: payload.parentType,
    parentId: payload.parentId,
  }, options);

  return objects;
};

/**
 * Listing objects including the source
 * @param {object} payload - Object containing payload data
 * @param {string} payload.objectIds - The id for objects to list
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listWithSources
 * @return {external:Promise.<Object[]>} {@link module:modules/feed~Object}
 */
export const listWithSources = async (payload, message) => {
  logger.info('Listing objects with sources', { payload, message });
  const objects = await objectRepository.findBy({
    id: { $in: payload.objectIds },
  });

  // Gathering the data to build the feed
  const objectSourceLinks = impl.createObjectSourceLinks(objects);
  const promisedSources = R.map(impl.findSourcesForFeed(message), objectSourceLinks);
  const sources = await Promise.map(promisedSources, Promise.props);
  const occurringTypes = R.pluck('type', objectSourceLinks);

  // Linking everything together
  return R.chain(occurringType => {
    const sourcesForType = impl.findWhereType(occurringType, sources);
    const linksForType = impl.findWhereType(occurringType, objectSourceLinks);

    return impl.mergeSourceAndObject(
      impl.objectsForType(occurringType, objects),
      linksForType.values,
      sourcesForType.values);
  }, occurringTypes);
};

/**
 * Create object
 * @param {object} payload - Object containing payload data
 * @param {string} payload.userId - The id that instantiated the object
 * @param {string} payload.parentType - The type of parent to get objects for
 * @param {string} payload.parentId - The id of the parent
 * @param {string} payload.objectType - The type of object
 * @param {string} payload.sourceId - The id that refers to the activity
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Object>} {@link module:modules/feed~Object}
 */
export const create = async (payload, message) => {
  logger.info('Creating object', { payload, message });

  return objectRepository.create(payload);
};

/**
 * Count objects
 * @param {object} payload - Object containing payload data
 * @param {string} payload.where.userId - The id that instantiated the object
 * @param {string} payload.where.parentType - The type of parent to get objects for
 * @param {string} payload.where.parentId - The id of the parent
 * @param {string} payload.where.objectType - The type of object
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method count
 * @return {external:Promise.<number>}
 */
export const count = async (payload, message) => {
  logger.info('Counting objects', { payload, message });
  const attributeWhitelist = ['parentType', 'parentId', 'userId', 'objectType'];

  return objectRepository.count(R.pick(attributeWhitelist, payload.where));
};

/**
 * Remove object
 * @param {object} payload - Object containing payload data
 * @param {string} payload.id - The id of the object
 * @param {string} payload.userId - The id that instantiated the object
 * @param {string} payload.parentType - The type of parent to get objects for
 * @param {string} payload.parentId - The id of the parent
 * @param {string} payload.objectType - The type of object
 * @param {string} payload.sourceId - The id that refers to the activity
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method remove
 * @return {external:Promise.<Object>} {@link module:modules/feed~Object}
 */
export const remove = async (payload, message) => {
  logger.info('Deleting objects', { payload, message });

  await objectRepository.deleteBy(payload);

  return true;
};
