import R from 'ramda';
import * as Logger from '../../../../shared/services/logger';
import * as objectService from '../object';
import * as messageService from '../message';

/**
 * @module modules/feed/services/object
 */

const logger = Logger.getLogger('FEED/service/feed');
const typeEq = R.propEq('objectType');
const messageIdEq = R.propEq('messageId');
const anyWithType = (type, objects) => R.any(typeEq(type), objects);
const getSourceIdsForType = (type, objects) => R.pipe(
  R.filter(typeEq(type)), R.pluck('sourceId'))(objects);

/**
 * Making a feed for a parent
 * @param {object} payload - Object containing payload data
 * @param {string} payload.parentType - The type of parent to get objects for
 * @param {string} payload.parentId - The id of the parent
 * @param {string} payload.include - The sub resources to include
 * @param {number} payload.limit - The limit of the resultset for pagination
 * @param {number} payload.offset - The offset of the resultset for pagination
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method make
 * @return {external:Promise.<Object>} {@link module:modules/feed~Object}
 */
export const make = async (payload, message) => {
  logger.info(`Making feed for ${payload.parentType}`, { payload, message });

  const whitelistedPayload = R.pick(['parentType', 'parentId', 'limit', 'offset'], payload);
  const relatedObjects = await objectService.list(whitelistedPayload, message);

  const hasInclude = R.contains(R.__, payload.include || []);
  const hasType = (type) => anyWithType(type, relatedObjects);
  const includes = { comments: [], likes: [] };

  if (hasType('feed_message')) {
    const messageIds = getSourceIdsForType('feed_message', relatedObjects);

    if (hasInclude('comments')) {
      includes.comments = await messageService.getComments({ messageIds });
    }
  }

  const objectsWithSources = await objectService.listWithSources({
    objectIds: R.pluck('id', relatedObjects) }, message);

  const findComments = (object) => (typeEq('feed_message')) ?
    R.defaultTo(null, R.filter(messageIdEq(object.sourceId), includes.comments)) : null;

  return R.map((object) => {
    if (hasInclude('comments')) {
      return R.assoc('comments', findComments(object), object);
    }

    return object;
  }, objectsWithSources);
};
