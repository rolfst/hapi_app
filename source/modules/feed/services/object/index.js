import R from 'ramda';
import Promise from 'bluebird';
import createError from '../../../../shared/utils/create-error';
import * as Logger from '../../../../shared/services/logger';
import * as networkRepository from '../../../core/repositories/network';
import * as teamRepository from '../../../core/repositories/team';
import * as userRepository from '../../../core/repositories/user';
import * as objectRepository from '../../repositories/object';
import * as impl from './implementation';

/**
 * @module modules/feed/services/object
 */

const logger = Logger.getLogger('FEED/service/object');

const objectsForTypeValuePair = (fn, pairs) => R.pipe(R.mapObjIndexed(fn), R.values)(pairs);
const getSources = R.pipeP(Promise.all, R.flatten, R.reject(R.isNil));
const groupByObjectType = R.groupBy(R.prop('objectType'));
const sourceIdsPerType = R.pipe(groupByObjectType, R.map(R.pluck('sourceId')));
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
 * Listing objects including the source and children
 * @param {object} payload - Object containing payload data
 * @param {string} payload.objectIds - The id for objects to list
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listWithSourceAndChildren
 * @return {external:Promise.<Object[]>} {@link module:modules/feed~Object}
 */
export const listWithSourceAndChildren = async (payload, message) => {
  logger.info('Listing objects with sources', { payload, message });

  const objects = await objectRepository.findBy({
    id: { $in: payload.objectIds } }, createOptionsFromPayload(payload));

  const promisedChildren = objectsForTypeValuePair(
    impl.findChildrenForType, sourceIdsPerType(objects));
  const children = await getSources(promisedChildren);

  const promisedSources = objectsForTypeValuePair(impl.findSourcesForType(message),
    R.merge(sourceIdsPerType(objects), sourceIdsPerType(children)));
  const sources = await getSources(promisedSources);

  const objectsWithSource = R.map(impl.addSourceToObject(sources), R.concat(objects, children));
  const findObjectById = (objectId) => R.find(R.propEq('id', objectId), objectsWithSource);

  const addChildrenToObject = (object) => R.merge(object, {
    children: impl.findChildren(objectsWithSource, object),
  });

  return R.pipe(
    R.pluck('id'),
    R.map(R.pipe(findObjectById, addChildrenToObject))
  )(objects);
};

/**
 * Get object including the source and children
 * @param {object} payload - Object containing payload data
 * @param {string} payload.objectId - The id for object to get
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getWithSourceAndChildren
 * @return {external:Promise.<Object[]>} {@link module:modules/feed~Object}
 */
export const getWithSourceAndChildren = async (payload, message) => {
  return R.head(await listWithSourceAndChildren({ objectIds: [payload.objectId] }, message));
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
 * @param {array} payload.where - list containing constraints
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
  const whereConstraint = { $or: R.flatten([payload.where]) };

  return objectRepository.count(whereConstraint);
};

/**
 * Get parent model for object
 * @param {object} payload - Object containing payload data
 * @param {string} payload.parentType - The type of parent to retrieve
 * @param {string} payload.parentId - The id of the parent
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getParent
 * @return {external:Promise}
 */
export const getParent = async (payload, message) => {
  logger.info('Retrieving parent for object', { payload, message });

  const result = await R.cond([
    [R.equals('network'), () => networkRepository.findNetworkById(payload.parentId)],
    [R.equals('team'), () => teamRepository.findTeamById(payload.parentId)],
    [R.equals('user'), () => userRepository.findUserById(payload.parentId, null, false)],
    [R.T, R.F],
  ])(payload.parentType);

  if (!result) throw createError('404', 'Parent not found');

  return result;
};

/**
 * Get users for parent model of object
 * @param {object} payload - Object containing payload data
 * @param {string} payload.parentType - The type of parent to retrieve
 * @param {string} payload.parentId - The id of the parent
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method usersForParent
 * @return {external:Promise}
 */
export const usersForParent = async (payload, message) => {
  logger.info('Retrieving users for parent of object', { payload, message });

  const result = await R.cond([
    [R.equals('network'), () => networkRepository.findUsersForNetwork(payload.parentId)],
    [R.equals('team'), () => teamRepository.findMembers(payload.parentId)],
    [R.T, R.F],
  ])(payload.parentType);

  if (!result) throw createError('404', 'Parent not found');

  return result;
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

/**
 * Retrieves an object
 * @param {object} payload - Object containing payload data
 * @param {string} payload.objectType - The type of object
 * @param {string} payload.sourceId - The id of the object
 * @param {string} payload.objectId - The id of the object
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method get
 * @return {external:Promise.<Object>} {@link module:modules/feed~Object}
 */
export const get = async (payload, message) => {
  logger.info('retrieving object', { payload, message });

  const attributes = R.pick(['objectId', 'objectType', 'sourceId'], payload);
  const objects = await objectRepository.findBy(attributes);
  const object = R.head(objects);

  if (!object) throw createError('404', 'Object not found');

  return object;
};
