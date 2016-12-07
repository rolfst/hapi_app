import { map, sample } from 'lodash';
import createError from '../../../shared/utils/create-error';
import { User, Network, NetworkUser, Integration, Team, TeamUser } from '../../../shared/models';
import createUserModel from '../models/user';
import createCredentialsModel from '../models/credentials';

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

export const findExternalUsers = async (externalIds) => {
  const pivotResult = await NetworkUser.findAll({ where: { externalId: { $in: externalIds } } });
  const userIds = pivotResult.map(result => result.userId);
  const result = await User.findAll({
    ...defaultIncludes,
    where: { id: { $in: userIds } },
  });

  return result;
};

export const findUsersByIds = async (userIds) => {
  const result = await User.findAll({ where: { id: { $in: userIds } } });

  return map(result, toModel);
};

export const findUserById = async (id) => {
  const user = await User.findOne({ where: { id } });
  if (!user) throw createError('403', `The user with id '${id}' could not be found.`);

  return toModel(user);
};

export const findUserByEmail = async (email) => {
  const result = await User.findOne({ where: { email } });
  if (!result) return null;

  return toModel(result);
};

export const findUserInNetworkByExternalId = async (networkId, externalId) => {
  const result = await NetworkUser.findOne({ where: { networkId, externalId } });
  if (!result) return null;

  return findUserById(result.userId);
};

export const findUserMetaDataForNetwork = async (userId, networkId) => {
  const result = await NetworkUser.findOne({
    where: { networkId, userId },
  });

  return result.get({ plain: true });
};

export const findMultipleUserMetaDataForNetwork = async (userIds, networkId) => {
  const result = await NetworkUser.findAll({
    where: { networkId, userId: { $in: userIds } },
  });

  return map(result, (item) => item.get({ plain: true }));
};

export const findCredentialsForUser = async (username) => {
  const result = await User.findOne({ where: { username } });

  if (!result) return null;

  return createCredentialsModel(result);
};

export const findUserByUsername = async (username) => {
  const result = await User.findOne({ where: { username } });
  if (!result) return null;

  return toModel(result);
};

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

export const addUsersToNetwork = (user, network, roleType = 'EMPLOYEE') => {
  return network.addUsers(user, { roleType });
};

export const setExternalId = async (userId, networkId, externalId) => {
  const result = await NetworkUser.findOne({ where: { userId, networkId } });

  return result.update({ externalId });
};

export const updateUser = async (userId, attributes) => {
  const user = await User.findById(userId);
  await user.update(attributes);

  return findUserById(userId);
};

export const updateUserByEmail = async (email, attributes) => {
  const user = await User.findOne({ where: { email } });
  const updatedUser = await user.update(attributes);

  return updatedUser.reload();
};

export const createUser = async (attributes) => {
  const values = Object.assign(attributes, {
    profileImg: sample(dummyProfileImgPaths),
  });
  const user = await User.create(values);

  return findUserById(user.id);
};

export const createBulkUsers = async (users) => {
  const promises = users
    .map(user => ({ ...user, profileImg: sample(dummyProfileImgPaths) }))
    .map(user => User.create(user));

  const result = await Promise.all(promises);

  return map(result, toModel);
};

export const validateUserIds = async (ids, networkId) => {
  const usersCount = await User.count({
    where: {
      id: { $in: ids },
    },
    include: [{ model: Network, required: true, where: { id: networkId } }],
  });

  return usersCount === ids.length;
};

export const addToTeam = async (userId, teamId) => {
  return TeamUser.create({ userId, teamId });
};

export const removeFromNetwork = async (userId, networkId, forceDelete = false) => {
  const result = await NetworkUser.findOne({
    where: { userId, networkId },
  });

  if (!result) return;

  return forceDelete ? result.destroy() : result.update({ deletedAt: new Date() });
};

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
 * @param {object} network - network object to update the userinfo for
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

export const deleteById = async (userId) => {
  return User.destroy({ where: { id: userId } });
};

export const userBelongsToNetwork = async (userId, networkId) => {
  const result = await NetworkUser.findOne({
    where: { networkId, userId, deletedAt: null },
  });

  return result !== null;
};

export const userIsDeletedFromNetwork = async (userId, networkId) => {
  const result = await NetworkUser.findOne({
    where: { networkId, userId },
  });

  return result ? result.deletedAt !== null : false;
};
