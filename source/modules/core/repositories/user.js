const { map, sample } = require('lodash');
const R = require('ramda');
const Promise = require('bluebird');
const createError = require('../../../shared/utils/create-error');
const createUserModel = require('../models/user');
const toUnscoped = require('../models/detailed-user');
const createNetworkLinkModel = require('../models/network-link');
const createCredentialsModel = require('../models/credentials');
const { User, Network, NetworkUser, Team } = require('./dao');

/**
 * @module modules/core/repositories/user
 */

const dummyProfileImgPaths = [
  'default/default-1.png',
  'default/default-2.png',
  'default/default-3.png',
];

const defaultIncludes = [{
  model: Team,
  attributes: ['id'],
  required: false,
}];

const toModel = (dao) => createUserModel(dao);
const toNetworkLinkModel = (dao) => createNetworkLinkModel(dao);

const findAllUsers = async () => {
  const result = await User.findAll();

  return map(result, toModel);
};

/**
 * Finds imported users in based on integration partner identifier
 * @param {string[]} externalIds - identifier how the user is known in integration partner
 * @method findExternalUsers
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User}
 */
const findExternalUsers = async (externalIds) => {
  const pivotResult = await NetworkUser.findAll({ where: { externalId: { $in: externalIds } } });
  const userIds = pivotResult.map((result) => result.userId);
  const result = await User.findAll(R.merge(
    { include: defaultIncludes }, { where: { id: { $in: userIds } } }
  ));

  return result;
};

/**
 * Finds users based on a list of ids
 * @param {string[]} userIds - identifier how the user is known
 * @param {string} [networkId] - identifier for a possible network
 * @method findByIds
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User}
 */
const findByIds = async (userIds, networkId = null) => {
  let includes = defaultIncludes;

  if (networkId) {
    includes = R.map(R.merge(R.__, { where: { networkId } }), includes);
  }

  const options = R.merge({ include: includes }, { where: { id: { $in: userIds } } });
  const result = await User.findAll(options);

  return map(result, toModel);
};

/**
 * Finds a user
 * @param {string} userId - identifier how the user is known
 * @param {string} networkId - identifier for what network the user need to be
 * retrieved
 * @param {string} [scoped=true] - flag to specifiy whether a user needs to be fetched
 * with network scoped attributes
 * @method findByIds
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
const findUserById = async (userId, networkId, scoped = true) => {
  if (scoped) {
    if (R.isNil(networkId)) throw createError('20001');
  }
  const includes = scoped
    ? { include: [{ model: Team,
      attributes: ['id'],
      where: { networkId },
      required: false }] }
    : {};
  const user = await User.findOne(R.merge(includes, { where: { id: userId } }));

  if (!user) throw createError('403', `The user with id '${userId}' could not be found.`);

  return toModel(user);
};

/**
 * Finds a user by given attributes
 * @param {object} attributes
 * @param {string} attributes.username
 * @param {string} attributes.email
 * @method findUserBy
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
const findUserBy = async (attributes) => {
  const result = await User.findOne({
    where: R.pick(['username', 'email'], attributes),
  });
  if (!result) return null;

  return toModel(result);
};

/**
 * finds a User without any scopes
 * @param {number} id
 * @returns {external:Promise.<User>} {@link module:modules/core~User User}
 */
const findUser = async (id) => {
  const result = await User.findById(id);
  if (!result) return null;

  return toModel(result);
};

/**
 * Finds a network-user association
 * @param {object} attributes
 * @param {string} attributes.externalId
 * @param {string} attributes.userId
 * @param {string} attributes.networkId
 * @method findNetworkLink
 * @return {external:Promise.<NetworkUser>} {@link module:modules/core~NetworkUser NetworkUser}
 */
const findNetworkLink = async (attributes) => {
  const result = await NetworkUser.findOne({
    where: R.pick(['externalId', 'userId', 'networkId'], attributes),
  });

  if (!result) return null;

  return toNetworkLinkModel(result);
};

/**
 * Finds all network-user associations in a network
 * @param {string[]} userIds - identifier how the user is known by the integration partner
 * @param {string} networkId - network identifier where the user is searched for
 * @method findMultipleUserMetaDataForNetwork
 * @return {external:Promise.<NetworkUser[]>} {@link module:modules/core~NetworkUser NetworkUser}
 */
const findMultipleUserMetaDataForNetwork = async (userIds, networkId) => {
  const result = await NetworkUser.findAll({
    where: { networkId, userId: { $in: userIds } },
  });

  return map(result, toNetworkLinkModel);
};

/**
 * Finds the user credentials for a user
 * @param {string} username - identifier to search the user for
 * @method findCredentialsForUser
 * @return {external:Promise.<Credentials>} {@link module:shared~Credentials Credentials}
 */
const findCredentialsForUser = async (username) => {
  const result = await User.findOne({ where: { username } });

  if (!result) return null;

  return createCredentialsModel(result);
};

/**
 * @param {string} userId - attribute to find the user with
 * @param {object} attributes - attributes to create a user with
 * @method updateUser
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
const updateUser = async (userId, attributes) => {
  const user = await User.findById(userId);
  await user.update(attributes);

  return findUserById(userId, null, false);
};

/**
 * @param {User} attributes - attributes to create a user with
 * @method createUser
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
const createUser = async (attributes) => {
  const whitelistedAttributes = [
    'username',
    'email',
    'firstName',
    'lastName',
    'phoneNum',
    'dateOfBirth',
    'password',
  ];

  const user = await User.create(
    R.merge(R.pick(whitelistedAttributes, attributes),
    { profileImg: sample(dummyProfileImgPaths) }));

  return findUserById(user.id, null, false);
};

/**
 * @param {object[]} users - {@link module:modules/core~User User} attributes for each to be
 * created user
 * @method createBulkUsers
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
const createBulkUsers = async (users) => {
  const result = await Promise.map(users, createUser);

  return map(result, toModel);
};

/**
 * Verifies if any id in the list of users is still valid
 * @param {string[]} ids - user ids
 * @param {string} networkId - network the users belong to
 * @method validateUserIds
 * @return {external:Promise.<boolean>} - Promise with boolean if all ids are valid
 */
const validateUserIds = async (ids, networkId) => {
  const usersCount = await User.count({
    where: {
      id: { $in: ids },
    },
    include: [{ model: Network, required: true, where: { id: networkId } }],
  });

  return usersCount === ids.length;
};

/**
 * removes a user from a network
 * @param {string} userId - users to to remove from network
 * @param {string} networkId - network to find the user in
 * @param {boolean} [forceDelete=false] - identifier how the user is known in the
 * integration partner
 * @method removeFromNetwork
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
const removeFromNetwork = async (userId, networkId, forceDelete = false) => {
  const result = await NetworkUser.findOne({
    where: { userId, networkId },
  });

  if (!result) return NetworkUser.create({ user_id: userId, networkId, deletedAt: new Date() });

  return forceDelete ? result.destroy() : result.update({ deletedAt: new Date() });
};

/**
 * Sets the network link for a user.
 * @param {object} whereConstraint
 * @param {object} attributes
 * @param {string} attributes.userId
 * @param {string} attributes.networkId
 * @param {string} [attributes.userToken]
 * @param {string} [attributes.roleType]
 * @param {string} [attributes.externalId]
 * @param {string} [attributes.deletedAt]
 * @param {string} [attributes.invitedAt]
 * @method setNetworkLink
 * @return {void}
 */
const setNetworkLink = async (whereConstraint, _attributes) => {
  const attributes = R.pick([
    'userId', 'networkId', 'externalId', 'deletedAt', 'userToken', 'roleType', 'invitedAt'],
    _attributes);

  const result = await NetworkUser.findOne({
    where: whereConstraint,
  });

  if (!result) return NetworkUser.create(R.merge(attributes, { user_id: attributes.userId }));

  return result.update(R.omit(['userId', 'networkId', 'externalId'], attributes));
};

const updateNetworkLink = (whereConstraint, attributes) =>
  NetworkUser.update(attributes, { where: whereConstraint });

/**
 * @param {string} userId - identifier for user to delete
 * @param {string} networkId - network to find the user in
 * @method userBelongsToNetwork
 * @return {external:Promise.<boolean>} Promise whether the user belongs to a network
 */
const userBelongsToNetwork = async (userId, networkId) => {
  const result = await NetworkUser.findOne({
    where: { networkId, userId, deletedAt: null },
  });

  return result !== null;
};

/**
 * Finds a user
 * @param {string} userId - identifier how the user is known
 * @param {string} networkId - identifier for what network the user need to be
 * retrieved
 * @param {string} [scoped=true] - flag to specifiy whether a user needs to be fetched
 * with network scoped attributes
 * @method findByIds
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
const findUnscopedById = async (userId) => {
  const user = await User.findOne({ where: { id: userId } });

  if (!user) throw createError('404', `The user with id '${userId}' could not be found.`);

  return toUnscoped(user);
};

/**
 * @param {string} userId - identifier for user to delete
 * @method deleteById
 * @return {external:Promise.<number>} Promise with amount of objects removed
 */
const deleteById = async (userId) => {
  return User.destroy({ where: { id: userId } });
};

const deleteAll = () => User.findAll()
  .then((users) => User.destroy({
    where: { id: { $in: R.pluck('id', users) } },
  }));

exports.createBulkUsers = createBulkUsers;
exports.createUser = createUser;
exports.deleteById = deleteById;
exports.findAllUsers = findAllUsers;
exports.findByIds = findByIds;
exports.findCredentialsForUser = findCredentialsForUser;
exports.findExternalUsers = findExternalUsers;
exports.findMultipleUserMetaDataForNetwork = findMultipleUserMetaDataForNetwork;
exports.findNetworkLink = findNetworkLink;
exports.findUnscopedById = findUnscopedById;
exports.findUser = findUser;
exports.findUserBy = findUserBy;
exports.findUserById = findUserById;
exports.userBelongsToNetwork = userBelongsToNetwork;
exports.updateNetworkLink = updateNetworkLink;
exports.updateUser = updateUser;
exports.removeFromNetwork = removeFromNetwork;
exports.setNetworkLink = setNetworkLink;
exports.validateUserIds = validateUserIds;
exports.deleteAll = deleteAll;
