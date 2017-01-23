import { map, omit, pick, sample } from 'lodash';
import R from 'ramda';
import Promise from 'bluebird';
import createError from '../../../shared/utils/create-error';
import { User, Network, NetworkUser, Integration, Team, TeamUser } from '../../../shared/models';
import createUserModel from '../models/user';
import createNetworkLinkModel from '../models/network-link';
import createCredentialsModel from '../models/credentials';

/**
 * @module modules/core/repositories/user
 */

const dummyProfileImgPaths = [
  'default/default-1.png',
  'default/default-2.png',
  'default/default-3.png',
];

const defaultIncludes = {
  include: [{
    model: Team,
  }, {
    model: Network,
    include: [{
      model: Integration,
      required: false,
    }, {
      model: User,
      as: 'SuperAdmin',
    }],
  }],
};

const toModel = (dao) => createUserModel(dao);
const toNetworkLinkModel = (dao) => createNetworkLinkModel(dao);

export const findAllUsers = async () => {
  const result = await User.findAll();

  return map(result, toModel);
};

/**
 * Finds imported users in based on integration partner identifier
 * @param {string[]} externalIds - identifier how the user is known in integration partner
 * @method findExternalUsers
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User}
 */
export const findExternalUsers = async (externalIds) => {
  const pivotResult = await NetworkUser.findAll({ where: { externalId: { $in: externalIds } } });
  const userIds = pivotResult.map(result => result.userId);
  const result = await User.findAll({
    ...defaultIncludes,
    where: { id: { $in: userIds } },
  });

  return result;
};

/**
 * Finds users based on a list of ids
 * @param {string[]} userIds - identifier how the user is known
 * @method findUsersByIds
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User}
 */
export const findUsersByIds = async (userIds) => {
  const result = await User.findAll({ ...defaultIncludes, where: { id: { $in: userIds } } });

  return map(result, toModel);
};

export const findPlainUsersByIds = async (userIds) => {
  const result = await User.findAll({ where: { id: { $in: userIds } } });

  return map(result, toModel);
};

/**
 * Finds a user
 * @param {string} userId - identifier how the user is known
 * @param {string} networkId - identifier for what network the user need to be
 * retrieved
 * @param {string} [scoped=true] - flag to specifiy whether a user needs to be fetched
 * with network scoped attributes
 * @method findUsersByIds
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
export const findUserById = async (userId, networkId, scoped = true) => {
  if (scoped) {
    if (R.isNil(networkId)) throw createError('20001');
  }
  const includes = scoped
    ? { include: [{ model: Team,
      attributes: ['id'],
      where: { networkId },
      required: false }] }
    : {};
  const user = await User.findOne({
    ...includes,
    where: { id: userId },
  });

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
export const findUserBy = async (attributes) => {
  const result = await User.findOne({
    where: { ...pick(attributes, 'username', 'email') },
  });
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
export const findNetworkLink = async (attributes) => {
  const result = await NetworkUser.findOne({
    where: { ...pick(attributes, 'externalId', 'userId', 'networkId') },
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
export const findMultipleUserMetaDataForNetwork = async (userIds, networkId) => {
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
export const findCredentialsForUser = async (username) => {
  const result = await User.findOne({ where: { username } });

  if (!result) return null;

  return createCredentialsModel(result);
};

/**
 * Adds user to a network
 * @param {User} users - users to add
 * @param {Network} network - network to add the users to
 * @method addUsersToNetwork
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User}
 */
export const addUsersToNetwork = (user, network, roleType = 'EMPLOYEE') => {
  return network.addUsers(user, { roleType });
};

/**
 * @param {string} userId - attribute to find the user with
 * @param {object} attributes - attributes to create a user with
 * @method updateUser
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
export const updateUser = async (userId, attributes) => {
  const user = await User.findById(userId);
  await user.update(attributes);

  return findUserById(userId, null, false);
};

/**
 * @param {User} attributes - attributes to create a user with
 * @method createUser
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
export const createUser = async (attributes) => {
  const whitelistedAttributes = [
    'username',
    'email',
    'firstName',
    'lastName',
    'phoneNum',
    'dateOfBirth',
    'password',
  ];

  const user = await User.create({
    ...pick(attributes, whitelistedAttributes),
    profileImg: sample(dummyProfileImgPaths),
  });

  return findUserById(user.id, null, false);
};

/**
 * @param {object[]} users - {@link module:modules/core~User User} attributes for each to be
 * created user
 * @method createBulkUsers
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
export const createBulkUsers = async (users) => {
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
export const validateUserIds = async (ids, networkId) => {
  const usersCount = await User.count({
    where: {
      id: { $in: ids },
    },
    include: [{ model: Network, required: true, where: { id: networkId } }],
  });

  return usersCount === ids.length;
};

/**
 * Adds a user to a team
 * @param {string} userId - user id
 * @param {string} teamId - team the users will belong to
 * @method validateUserIds
 * @return {external:Promise.<TeamUser>} - Promise with a team-user association
 */
export const addToTeam = async (userId, teamId) => {
  return TeamUser.create({ userId, teamId });
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
export const removeFromNetwork = async (userId, networkId, forceDelete = false) => {
  const result = await NetworkUser.findOne({
    where: { userId, networkId },
  });

  if (!result) return NetworkUser.create({ user_id: userId, networkId, deletedAt: new Date() });

  return forceDelete ? result.destroy() : result.update({ deletedAt: new Date() });
};

/**
 * Sets the network link for a user.
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
export const setNetworkLink = async (_attributes) => {
  const attributes = pick(_attributes,
    'userId', 'networkId', 'externalId', 'deletedAt', 'userToken', 'roleType', 'invitedAt');

  const result = await NetworkUser.findOne({
    where: { userId: attributes.userId, networkId: attributes.networkId },
  });

  if (!result) return NetworkUser.create({ ...attributes, user_id: attributes.userId });

  return result.update({ ...omit(attributes, 'userId, networkId') });
};

/**
 * updates the networkUser
 * the user is from the external source
 * @Param {object} user - externalInformation of user
 * @param {string} network - network id to update the userinfo for
 * @param {string} [active=true] - network id to update the userinfo for
 * @method updateUserForNetwork
 * @return user object
 */
export const updateUserForNetwork = async (user, networkId, active = true) => {
  const deletedAt = active ? null : new Date();
  const roleType = user.isAdmin ? 'ADMIN' : 'EMPLOYEE';
  const result = await NetworkUser.findOne({
    where: { externalId: user.externalId, networkId },
  });
  const networkUser = await result.update({
    deletedAt,
    roleType,
  });

  return findUserById(networkUser.userId, networkId);
};

/**
 * @param {string} userId - identifier for user to delete
 * @method deleteById
 * @return {external:Promise.<number>} Promise with amount of objects removed
 */
export const deleteById = async (userId) => {
  return User.destroy({ where: { id: userId } });
};

/**
 * @param {string} userId - identifier for user to delete
 * @param {string} networkId - network to find the user in
 * @method userBelongsToNetwork
 * @return {external:Promise.<boolean>} Promise whether the user belongs to a network
 */
export const userBelongsToNetwork = async (userId, networkId) => {
  const result = await NetworkUser.findOne({
    where: { networkId, userId, deletedAt: null },
  });

  return result !== null;
};
