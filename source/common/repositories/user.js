import _ from 'lodash';
import sequelize from 'sequelize';
import db from 'connection';
import { User, Network, Integration, Team } from 'common/models';

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
    }],
  }],
};

export function findAllUsers() {
  return User.findAll(defaultIncludes);
}

export async function findUserById(id) {
  const user = await User.findOne({ ...defaultIncludes, where: { id } });
  if (!user) throw new Error(`No user found with id ${id}`);

  return user;
}

export async function findUserByUsername(username) {
  const user = await User.findOne({ ...defaultIncludes, where: { username } });
  if (!user) throw new Error(`No user found with username ${username}`);

  return user;
}

export function getIntegrationTokensForUser(user) {
  const result = user.Networks
    .filter(network => network.NetworkUser.userToken !== null)
    .map(network => ({
      name: network.Integrations[0].name,
      token: network.NetworkUser.userToken,
      externalId: network.NetworkUser.externalId,
    }));

  return result;
}

export function updateUser(userId, attributes) {
  return User.findById(userId)
    .then(user => {
      return user.update(attributes).then(() => user);
    })
    .then(updatedUser => updatedUser.reload());
}

export function createUser(attributes) {
  const values = Object.assign(attributes, {
    profileImg: _.sample(dummyProfileImgPaths),
  });

  return User.create(values).then(user => {
    return findUserById(user.id);
  });
}

export function createOrUpdateUser(identifier, data) {
  return User.findOne({ where: identifier })
    .then(user => {
      if (user) {
        return user.update(data);
      }
      return createUser(data);
    });
}

export function createUsers(userCollection) {
  const values = userCollection.map(user => {
    const userWithProfileImg = Object.assign(user, {
      profileImg: _.sample(dummyProfileImgPaths),
    });

    return userWithProfileImg;
  });

  return User.bulkCreate(values);
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
