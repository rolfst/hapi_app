import R from 'ramda';
import * as Logger from '../../../../shared/services/logger';
import * as objectService from '../object';
import * as objectRepository from '../../repositories/object';
import * as impl from './implementation';

/**
 * @module modules/feed/services/object
 */

const logger = Logger.getLogger('FEED/service/feed');
const typeEq = R.propEq('objectType');
const messageIdEq = R.propEq('messageId');
const findIncludes = (object, includes) => (typeEq('feed_message')) ?
  R.defaultTo(null, R.filter(messageIdEq(object.sourceId), includes)) : null;

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

  const whereClause = await R.cond([
    [R.equals('network'),
    () => impl.createNetworkObjectQuery(payload.parentId, message.credentials.id)],
    [R.T, () => ({
      $or: [{
        parentType: payload.parentType,
        parentId: payload.parentId,
      }, {
        parentType: 'user',
        parentId: message.credentials.id,
      }],
    })],
  ])(payload.parentType);

  const relatedObjects = await objectRepository.findBy(whereClause, {
    limit: payload.limit,
    offset: payload.offset,
    order: [['created_at', 'DESC']],
  });

  const hasInclude = R.contains(R.__, payload.include || []);
  const includes = await impl.getIncludes(hasInclude, relatedObjects);

  const objectsWithSources = await objectService.listWithSourceAndChildren({
    objectIds: R.pluck('id', relatedObjects) }, message);
  const addComments = (object) =>
    R.assoc('comments', findIncludes(object, includes.comments), object);
  const addLikes = (object) =>
    R.assoc('likes', findIncludes(object, includes.likes), object);

  const createObjectWithIncludes = R.cond([
    [() => R.and(hasInclude('comments'), hasInclude('likes')), R.pipe(addComments, addLikes)],
    [() => hasInclude('comments'), addComments],
    [() => hasInclude('likes'), addLikes],
    [R.T, R.identity],
  ]);

  return R.map(createObjectWithIncludes, objectsWithSources);
};
