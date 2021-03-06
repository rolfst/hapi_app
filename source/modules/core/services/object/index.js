const R = require('ramda');
const Promise = require('bluebird');
const createError = require('../../../../shared/utils/create-error');
const networkRepository = require('../../../core/repositories/network');
const teamRepository = require('../../../core/repositories/team');
const userRepository = require('../../../core/repositories/user');
const organisationRepository = require('../../../core/repositories/organisation');
const objectRepository = require('../../repositories/object');
const objectSeenRepository = require('../../repositories/object-seen');
const impl = require('./implementation');
const { EObjectTypes } = require('../../../core/definitions');

/**
 * @module modules/core/services/object
 */

const logger = require('../../../../shared/services/logger')('CORE/service/object');

const objectsForTypeValuePair = (fn, pairs) => Object.keys(pairs)
  .map((key) => fn(pairs[key], key));
const fetchPromises = R.pipeP(Promise.all, R.values, R.flatten, R.reject(R.isNil));
const groupByObjectType = R.groupBy(R.prop('objectType'));
const sourceIdsPerType = R.pipe(groupByObjectType, R.map(R.pluck('sourceId')));
const createOptionsFromPayload = R.pipe(
  R.pick(['offset', 'limit']),
  R.assoc('order', [['createdAt', 'desc']]));

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
const list = async (payload, message) => {
  logger.debug('Listing objects', { payload, message });

  const objects = await objectRepository.findBy({
    parentType: payload.parentType,
    parentId: payload.parentId,
  }, createOptionsFromPayload(payload), message && message.credentials && message.credentials.id);

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
const listWithSourceAndChildren = async (payload, message, userId = null) => {
  logger.debug('Listing objects with sources', { payload, message });

  const objects = await objectRepository.findBy({
    id: { $in: payload.objectIds },
  }, createOptionsFromPayload(payload), userId);

  const promisedChildren = R.mapObjIndexed(
    (sourceIds, type) => impl.findChildrenForType(type, sourceIds, message),
    sourceIdsPerType(objects)
  );

  const children = await Promise.props(promisedChildren)
    .then(R.pipe(R.values, R.flatten));

  const sourceIds = R.merge(sourceIdsPerType(objects), sourceIdsPerType(children));
  const promisedSources = objectsForTypeValuePair(impl.findSourcesForType(message), sourceIds);
  const sources = await fetchPromises(promisedSources);

  const objectsWithSource = R.map(impl.addSourceToObject(sources), R.concat(objects, children));
  const findObjectById = (objectId) => R.find(R.propEq('id', objectId), objectsWithSource);

  const addChildrenToObject = (object) => R.merge(object, {
    children: R.map((foundChildren) => R.merge(foundChildren, {
      userId: object.userId,
    }), impl.findChildren(objectsWithSource, object)),
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
const getWithSourceAndChildren = async (payload, message) => {
  return R.head(await listWithSourceAndChildren({ objectIds: [payload.objectId] }, message));
};

/**
 * Create object
 * @param {object} payload - Object containing payload data
 * @param {string} payload.userId - The id that instantiated the object
 * @param {string} payload.networkId - The network the object belongs to
 * @param {string} payload.parentType - The type of parent to get objects for
 * @param {string} payload.parentId - The id of the parent
 * @param {string} payload.objectType - The type of object
 * @param {string} payload.sourceId - The id that refers to the activity
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Object>} {@link module:modules/feed~Object}
 */
const create = async (payload, message) => {
  logger.debug('Creating object', { payload, message });

  return objectRepository.create(payload);
};

/**
 * Count objects
 * @param {object} payload - Object containing payload data
 * @param {object} [payload.constraint] - Query constraint that is directly passed to model
 * @param {string} [payload.userId] - The id that instantiated the object
 * @param {string} [payload.parentType] - The type of parent to get objects for
 * @param {string} [payload.parentId] - The id of the parent
 * @param {string} [payload.objectType] - The type of object
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method count
 * @return {external:Promise.<number>}
 */
const count = async (payload, message) => {
  logger.debug('Counting objects', { payload, message });
  if (payload.constraint) return objectRepository.count(payload.constraint);

  const whitelistAttrs = ['userId', 'parentType', 'parentId', 'objectType', 'organisationId'];
  const attributes = [R.pick(whitelistAttrs, payload)];

  return objectRepository.count({ $or: attributes });
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
const getParent = async (payload, message) => {
  logger.debug('Retrieving parent for object', { payload, message });

  const result = await R.cond([
    [R.equals('network'), () => networkRepository.findNetworkById(payload.parentId)],
    [R.equals('team'), () => teamRepository.findTeamById(payload.parentId)],
    [R.equals('user'), () => userRepository.findUserById(payload.parentId, null, false)],
    [R.equals('organisation'), () => organisationRepository.findById(payload.parentId)],
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
const usersForParent = async (payload, message) => {
  logger.debug('Retrieving users for parent of object', { payload, message });

  const result = await R.cond([
    [R.equals('organisation'), () => organisationRepository
      .findUsers({ organisationId: payload.parentId, deletedAt: null })
      .then(R.pluck('userId'))
      .then(userRepository.findByIds)],
    [R.equals('network'), () => networkRepository.findUsersForNetwork(payload.parentId)],
    [R.equals('team'), () => teamRepository.findMembers(payload.parentId)],
    [R.equals('user'), () => userRepository.findUserById(payload.parentId, null, false)],
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
const remove = async (payload, message) => {
  logger.debug('Deleting objects', { payload, message });

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
const get = async (payload, message) => {
  logger.debug('Retrieving object', { payload, message });

  const attributes = R.pick(['id', 'objectType', 'sourceId'], payload);
  const objects = await objectRepository.findBy(attributes);
  const object = R.head(objects);

  if (!object) throw createError('404', 'Object not found');

  return object;
};

/**
 * Mark object seen
 * @param {object} payload - Object containing payload data
 * @param {string} payload.ids - An array of objects to mark as read
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method markAsSeen
 * @return {external:Promise.<Array<Object ids>>}
 */
const markAsSeen = async (payload, message) => {
  logger.debug('Marking object(s) as read', { payload, message });

  const createdRecords = await Promise.map(payload.ids, (id) =>
    objectSeenRepository.create({
      objectId: id,
      userId: message.credentials.id,
    }, { ignore: true }));

  return R.pipe(R.pluck('objectId'), R.reject(R.isNil))(createdRecords);
};

async function listForMessages(payload, message) {
  logger.debug('listing all objects for messages', { payload, message });

  let context = null;
  if (payload.organisationId) {
    context = { organisationId: payload.organisationId };
  } else if (payload.networkId) {
    context = { networkId: payload.networkid };
  }
  const constraint = R.merge(context, {
    sourceId: { $in: payload.messageIds },
    objectType: { $in: [EObjectTypes.ORGANISATION_MESSAGE, EObjectTypes.FEED_MESSAGE] },
  });

  return objectRepository.findBy(constraint);
}

exports.count = count;
exports.create = create;
exports.get = get;
exports.getParent = getParent;
exports.getWithSourceAndChildren = getWithSourceAndChildren;
exports.list = list;
exports.listForMessages = listForMessages;
exports.listWithSourceAndChildren = listWithSourceAndChildren;
exports.markAsSeen = markAsSeen;
exports.remove = remove;
exports.usersForParent = usersForParent;
