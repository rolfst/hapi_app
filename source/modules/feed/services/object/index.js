import * as Logger from '../../../../shared/services/logger';
import * as objectRepository from '../../repositories/object';

/**
 * @module modules/feed/services/object
 */

const logger = Logger.getLogger('FEED/service/object');

/**
 * Listing objects for a specific parent
 * @param {object} payload - Object containing payload data
 * @param {string} payload.parentType - The type of parent to get objects for
 * @param {string} payload.parentId - The id of the parent
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listObjects
 * @return {external:Promise.<Mixed[]>}
 */
export const listObjects = async (payload, message) => {
  logger.info('Listing objects', { payload, message });

  const objects = await objectRepository.findBy({
    parentType: payload.parentType,
    parentId: payload.parentId,
  });

  return objects;
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
 * @method createObject
 * @return {external:Promise.<Object>}
 */
export const createObject = async (payload, message) => {
  logger.info('Creating object', { payload, message });
  // TODO Create object
};
