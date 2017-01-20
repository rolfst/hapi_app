import R from 'ramda';
import * as Logger from '../../../../shared/services/logger';
import * as ObjectRepository from '../../repositories/object';

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
 * @method list
 * @return {external:Promise.<Object[]>} {@link module:feed~Object object}
 */
export const list = async (payload, message) => {
  logger.info('Listing objects', { payload, message });

  const objectResult = ObjectRepository.findBy({
    parentType: payload.parentType,
    parentId: payload.parentId,
  });

  return objectResult;
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
 * @return {external:Promise.<Object>} {@link module:feed~Object object}
 */
export const create = async (payload, message) => {
  logger.info('Creating object', { payload, message });

  return ObjectRepository.create(
    R.pick(['userId', 'parentType', 'parentId', 'objectType', 'sourceId'], payload)
  );
};
