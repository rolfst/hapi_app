import _ from 'lodash';
import sequelize from 'sequelize';
import { db } from 'connections';
import { User, Network, NetworkUser, Integration, Team } from 'common/models';

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

export function findAllUsers() {
  return User.findAll(defaultIncludes);
}

export const findExternalUsers = async (externalIds) => {
  const pivotResult = await NetworkUser.findAll({ where: { externalId: { $in: externalIds } } });
  const userIds = pivotResult.map(result => result.userId);
  const result = await User.findAll({
    ...defaultIncludes,
    where: { id: { $in: userIds } },
  });

  return result;
};

export async function findUserById(id) {
  const user = await User.findOne({ ...defaultIncludes, where: { id } });
  if (!user) throw new Error(`No user found with id ${id}`);

  return user;
}

export function findUserByEmail(email) {
  return User.findOne({ ...defaultIncludes, where: { email } });
}

export async function findUserByUsername(username) {
  const user = await User.findOne({ ...defaultIncludes, where: { username } });
  if (!user) throw new Error(`No user found with username ${username}`);

  return user;
}

export function addExternalUsersToNetwork(users, network) {
  const promises = users
    .map(user => NetworkUser.create({
      externalId: user.externalId,
      networkId: network.id,
      userId: user.id,
      roleType: user.roleType,
      deletedAt: user.isActive ? null : new Date(),
    }));

  return Promise.all(promises);
}

export function addUsersToNetwork(user, network, roleType = 'EMPLOYEE') {
  return network.addUsers(user, { roleType });
}

export async function addUserToNetwork(user, network, {
  roleType = 'EMPLOYEE',
  externalId = null,
  isActive = true,
}) {
  await network
    .addUser(user, { roleType, externalId, deletedAt: isActive ? null : new Date() });

  return user.reload();
}

export async function updateUser(userId, attributes) {
  const user = await User.findById(userId);
  const updatedUser = await user.update(attributes);

  return updatedUser.reload();
}

export async function updateUserByEmail(email, attributes) {
  const user = await User.findOne({ where: { email } });
  const updatedUser = await user.update(attributes);

  return updatedUser.reload();
}

export function createUser(attributes) {
  const values = Object.assign(attributes, {
    profileImg: _.sample(dummyProfileImgPaths),
  });

  return User.create(values).then(user => {
    return findUserById(user.id);
  });
}

export function createBulkUsers(users) {
  const promises = users
    .map(user => ({
      ...user,
      profileImg: _.sample(dummyProfileImgPaths),
    }))
    .map(user => User.create(user));

  return Promise.all(promises);
}

export async function validateUserIds(ids, networkId) {
  const usersCount = await User.count({
    where: {
      id: { $in: ids },
    },
    include: [{ model: Network, required: true, where: { id: networkId } }],
  });

  return usersCount === ids.length;
}

export function updateNetworkActivityForUser(networkId, userId, active) {
  const deletedAt = active ? null : sequelize.fn('NOW');
  const queryString = `
    UPDATE network_user
    SET deleted_at = ?
    WHERE user_id = ?
    AND network_id = ?
  `;

  return db.query(queryString, {
    type: sequelize.QueryTypes.UPDATE,
    replacements: [deletedAt, userId, networkId],
  });
}

export async function setIntegrationToken(user, network, token) {
  const result = await NetworkUser.findOne({
    where: { userId: user.id, networkId: network.id },
  });

  if (!result) throw new Error('User does not belong to the network.');

  return result.update({ userToken: token });
}

export function userBelongsToNetwork(userId, networkId) {
  const queryString = `
    SELECT user_id
    FROM network_user
    WHERE user_id = ?
    AND network_id = ?
    LIMIT 1
  `;

  return db.query(queryString, {
    type: sequelize.QueryTypes.SELECT,
    replacements: [userId, networkId],
  }).then(results => results.length === 1);
}
