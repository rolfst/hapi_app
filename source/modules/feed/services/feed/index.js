import R from 'ramda';
import * as Logger from '../../../../shared/services/logger';
import * as objectService from '../object';

/**
 * @module modules/feed/services/object
 */

const logger = Logger.getLogger('FEED/service/feed');

/**
 * Making a feed for a parent
 * @param {object} payload - Object containing payload data
 * @param {string} payload.parentType - The type of parent to get objects for
 * @param {string} payload.parentId - The id of the parent
 * @param {number} payload.limit - The limit of the resultset for pagination
 * @param {number} payload.offset - The offset of the resultset for pagination
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method make
 * @return {external:Promise.<Object>} {@link module:modules/feed~Object}
 */
export const make = async (payload, message) => {
  logger.info(`Making feed for ${payload.parentType}`, { payload, message });

  const whitelistedPayload = R.pick(['parentType', 'parentId', 'limit', 'offset'], payload);
  const relatedObjects = await objectService
    .list(whitelistedPayload, message);

  return objectService
    .listWithSources({ objectIds: R.pluck('id', relatedObjects) }, message)
    .then(R.sort(R.descend(R.prop('createdAt'))));
};
