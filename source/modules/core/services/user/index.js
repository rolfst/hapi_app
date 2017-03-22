const { map, find } = require('lodash');
const R = require('ramda');
const Promise = require('bluebird');
const createError = require('../../../../shared/utils/create-error');
const Logger = require('../../../../shared/services/logger');
const userRepo = require('../../repositories/user');
const networkRepo = require('../../repositories/network');
const networkService = require('../../services/network');

/**
 * @module modules/core/services/user
 */
const logger = Logger.getLogger('CORE/service/user');

/**
 * Retrieve user without network scope
 * @param {object} payload - Object containing payload data
 * @param {number} payload.userId - The id for the user to find
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getUser
 * @return {external:Promise.<User>} {@link module:modules/core~User User} model
 */
const getUser = async (payload) => {
  return userRepo.findUserById(payload.userId, null, false);
};

/**
 * Retrieve multiple users by id with network scope
 * @param {object} payload - Object containing payload data
 * @param {array} payload.userIds - The ids for the user to find
 * @param {string} payload.networkId - The ids for the network to find the users in
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listUsersWithNetworkScope
 * @return {external:Promise.<User[]>} {@link module:modules/core~User} Promise containing
 * collection of users
 */
async function listUsersWithNetworkScope(payload, message) {
  logger.info('Listing users with network scope', { payload, message });

  const users = await userRepo.findByIds(payload.userIds, payload.networkId);
  const network = await networkService.get({ networkId: payload.networkId }, message);
  const metaDataList = await userRepo.findMultipleUserMetaDataForNetwork(
    map(users, 'id'), network.id);
  const usersInNetwork = R.filter(user => R.find(R.propEq('userId', user.id), metaDataList), users);

  return Promise.map(usersInNetwork, async (user) => {
    const metaData = find(metaDataList, { userId: user.id });

    return R.merge(user,
      {
        roleType: metaData.roleType,
        externalId: metaData.externalId,
        deletedAt: metaData.deletedAt,
        invitedAt: metaData.invitedAt,
        integrationAuth: !!metaData.userToken,
      });
  });
}

/**
 * Retrieve user with network scope
 * @param {object} payload - Object containing payload data
 * @param {number} payload.id - The id for the user to find
 * @param {number} payload.networkId - The id of network to apply scope
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getUserWithNetworkScope
 * @return {external:Promise.<User[]>} {@link module:modules/core~User} Promise containing
 * collection of users
 */
async function getUserWithNetworkScope(payload, message) {
  logger.info('Get user with network scope', { payload, message });
  const [user, network] = await Promise.all([
    userRepo.findUserById(payload.id, payload.networkId),
    networkRepo.findNetworkById(payload.networkId),
  ]);

  const networkLink = await userRepo.findNetworkLink({ userId: user.id, networkId: network.id });

  if (!networkLink) throw createError('10002');

  return R.merge(user,
    {
      roleType: networkLink.roleType,
      externalId: networkLink.externalId,
      deletedAt: networkLink.deletedAt,
      invitedAt: networkLink.invitedAt,
      integrationAuth: !!networkLink.userToken,
    });
}

exports.getUserWithNetworkScope = getUserWithNetworkScope;
exports.listUsersWithNetworkScope = listUsersWithNetworkScope;
exports.getUser = getUser;
