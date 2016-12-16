import { map, pick, sample } from 'lodash';
import Promise from 'bluebird';
import createError from '../../../shared/utils/create-error';
import { User, Network, NetworkUser, Integration, Team, TeamUser } from '../../../shared/models';
import createUserModel from '../models/user';
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

/**
 * Finds a user
 * @param {string} ids - identifier how the user is known
 * @method findUsersByIds
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
export const findUserById = async (id) => {
  const user = await User.findOne({ ...defaultIncludes, where: { id } });
  if (!user) throw createError('403', `The user with id '${id}' could not be found.`);

  return toModel(user);
};

/**
 * Finds a user by email address
 * @param {string} email - identifier how the user is known
 * @method findUsersByEmail
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
export const findUserByEmail = async (email) => {
  const result = await User.findOne({ where: { email } });
  if (!result) return null;

  return toModel(result);
};

/**
 * Finds a user in a network by an externalId
 * @param {string} networkId - network identifier where the user is searched for
 * @param {string} externalId - identifier how the user is known by the integration partner
 * @method findUserInNetworkByExternalId
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
export const findUserInNetworkByExternalId = async (networkId, externalId) => {
  const result = await NetworkUser.findOne({ where: { networkId, externalId } });
  if (!result) return null;

  return findUserById(result.userId);
};

/**
 * Finds a network-user association
 * @param {string} userId - identifier how the user is known by the integration partner
 * @param {string} networkId - network identifier where the user is searched for
 * @method findUserMetaDataForNetwork
 * @return {external:Promise.<NetworkUser>} {@link module:modules/core~NetworkUser NetworkUser}
 */
export const findUserMetaDataForNetwork = async (userId, networkId) => {
  const result = await NetworkUser.findOne({
    where: { networkId, userId },
  });

  return result.get({ plain: true });
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

  return map(result, (item) => item.get({ plain: true }));
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
 * Finds the user by username
 * @param {string} username - identifier to search the user for
 * @method findUserByUsername
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
export const findUserByUsername = async (username) => {
  const result = await User.findOne({ where: { username } });
  if (!result) return null;

  return toModel(result);
};

/**
 * Adds externalUsers to a network
 * @param {User[]} users - users to add
 * @param {Network} network - network to add the users to
 * @method addExternalUsersToNetwork
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User}
 */
export const addExternalUsersToNetwork = (users, network) => {
  const promises = users
    .map(user => NetworkUser.create({
      externalId: user.externalId,
      networkId: network.id,
      userId: user.id,
      roleType: user.roleType,
      deletedAt: user.isActive ? null : new Date(),
    }));

  return Promise.all(promises);
};

/**
 * Adds user to a network
 * @param {User} users - users to add
 * @param {Network} network - network to add the users to
 * @method addExternalUsersToNetwork
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User}
 */
export const addUsersToNetwork = (user, network, roleType = 'EMPLOYEE') => {
  return network.addUsers(user, { roleType });
};

/**
 * sets the externalId on a user
 * @param {string} userId - users to to update
 * @param {string} networkId - network to find the user in
 * @param {string} externalId - identifier how the user is known in the integration partner
 * @method setExternalId
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
export const setExternalId = async (userId, networkId, externalId) => {
  const result = await NetworkUser.findOne({ where: { userId, networkId } });

  return result.update({ externalId });
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

  return findUserById(userId);
};

/**
 * @param {string} email - attribute to find the user with
 * @param {object} attributes - attributes to create a user with
 * @method updateUserByEmail
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
export const updateUserByEmail = async (email, attributes) => {
  const user = await User.findOne({ where: { email } });
  const updatedUser = await user.update(attributes);

  return updatedUser.reload();
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

  return findUserById(user.id);
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

  if (!result) return;

  return forceDelete ? result.destroy() : result.update({ deletedAt: new Date() });
};

/**
 * sets the externalId on a user
 * @param {User} user - users to to update
 * @param {Network} network - network to find the user in
 * @param {string} token - identifier how the user is known in the integration partner
 * @method setIntegrationToken
 * @return {external:Promise.<User>} {@link module:modules/core~User User}
 */
export const setIntegrationToken = async (user, network, token) => {
  const result = await NetworkUser.findOne({
    where: { userId: user.id, networkId: network.id },
  });

  if (!result) throw createError('10002');

  return result.update({ userToken: token });
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

  return findUserById(networkUser.userId);
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

/**
 * @param {string} userId - identifier for user to delete
 * @param {string} networkId - network to find the user in
 * @method userIsDeletedFromNetwork
 * @return {external:Promise.<boolean>} Promise whether the user is deleted in a network
 */
export const userIsDeletedFromNetwork = async (userId, networkId) => {
  const result = await NetworkUser.findOne({
    where: { networkId, userId },
  });

  return result ? result.deletedAt !== null : false;
};
