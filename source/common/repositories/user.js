import _ from 'lodash';
import sequelize from 'sequelize';
import db from 'connection';
import { User } from 'common/models';

const dummyProfileImgPaths = [
  'default/default-1.png',
  'default/default-2.png',
  'default/default-3.png',
];

export function findAllUsers() {
  return User.findAll();
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

  return User.create(values);
}

export function findUserByUsername(username) {
  return User.findOne({ where: { username } });
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
