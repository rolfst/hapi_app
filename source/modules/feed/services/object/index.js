import R from 'ramda';
import Promise from 'bluebird';
import * as Logger from '../../../../shared/services/logger';
import * as objectRepository from '../../repositories/object';
import * as impl from './implementation';

/**
 * @module modules/feed/services/object
 */

const logger = Logger.getLogger('FEED/service/object');
const typeEq = R.propEq('type');
const idEq = R.propEq('id');
const getSources = R.pipeP(Promise.all, R.flatten, R.reject(R.isNil));
const groupByObjectType = R.groupBy(R.prop('objectType'));
const sourceIdsPerType = R.pipe(groupByObjectType, R.map(R.pluck('sourceId')));
const whereTypeAndId = (type, id) => R.both(typeEq(type), idEq(id));
const createOptionsFromPayload = R.pipe(
  R.pick(['offset', 'limit']),
  R.assoc('order', [['createdAt', 'desc']])
);

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

  const objects = await objectRepository.findBy({
    parentType: payload.parentType,
    parentId: payload.parentId,
  }, createOptionsFromPayload(payload));

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
    id: { $in: payload.objectIds } }, createOptionsFromPayload(payload));

  const promisedSources = R.pipe(
    sourceIdsPerType,
    R.mapObjIndexed(impl.findSourcesForType(message)),
    R.values
  )(objects);

  const sources = await getSources(promisedSources);
  const findSource = (type, id) => R.find(whereTypeAndId(type, id), sources) || null;

  return R.map((object) =>
    R.merge(object, { source: findSource(object.objectType, object.sourceId) }), objects);
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
