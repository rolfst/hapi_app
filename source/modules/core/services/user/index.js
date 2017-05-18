const { map, find } = require('lodash');
const R = require('ramda');
const Promise = require('bluebird');
const createError = require('../../../../shared/utils/create-error');
const userRepo = require('../../repositories/user');
const networkRepo = require('../../repositories/network');
const networkService = require('../../services/network');
const organisationRepo = require('../../repositories/organisation');

/**
 * @module modules/core/services/user
 */
const logger = require('../../../../shared/services/logger')('CORE/service/user');

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
  logger.debug('Listing users with network scope', { payload, message });

  const users = await userRepo.findByIds(payload.userIds, payload.networkId);
  const userIds = map(users, 'id');

  const network = await networkService.get({ networkId: payload.networkId }, message);

  const [metaDataList, functions] = await Promise.all([
    userRepo.findMultipleUserMetaDataForNetwork(userIds, network.id),
    organisationRepo.findFunctionsForUsers({ $in: userIds }),
  ]);

  const findFunctionForUser = (user) =>
    R.pathOr(
      user.function,
      ['function', 'name'],
      R.find(R.propEq('userId', parseInt(user.id, 10)), functions)
    );

  const usersInNetwork = R.filter((user) => R.find(R.propEq('userId', user.id), metaDataList), users);

  return Promise.map(usersInNetwork, async (user) => {
    const metaData = find(metaDataList, { userId: user.id });

    return R.merge(user,
      {
        roleType: metaData.roleType,
        externalId: metaData.externalId,
        deletedAt: metaData.deletedAt,
        invitedAt: metaData.invitedAt,
        integrationAuth: !!metaData.userToken,
        function: findFunctionForUser(user),
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
  logger.debug('Get user with network scope', { payload, message });
  const [user, network, organisationUserWithFunction] = await Promise.all([
    userRepo.findUserById(payload.id, payload.networkId),
    networkRepo.findNetworkById(payload.networkId),
    organisationRepo.findFunctionForUser(payload.id),
  ]);

  const networkLink = await userRepo.findNetworkLink({ userId: user.id, networkId: network.id });

  if (!networkLink) throw createError('10002');

  return R.merge(user,
    {
      roleType: networkLink.roleType,
      externalId: networkLink.externalId,
      deletedAt: networkLink.deletedAt,
      invitedAt: networkLink.invitedAt,
      lastActive: networkLink.lastActive,
      integrationAuth: !!networkLink.userToken,
      // Function has a fallback in the model
      function: organisationUserWithFunction
        ? organisationUserWithFunction.function.name
        : user.function,
      lastActive: networkLink.lastActive,
    });
}

async function getScoped(payload, message) {
  logger.debug('Fetching user information with scopes', { payload, message });

  const [user, organisations, networks] = await Promise.all([
    userRepo.findUnscopedById(payload.id),
    organisationRepo.findForUser(payload.id, true),
    networkRepo.findNetworksForUser(payload.id, true),
  ]);

  return R.merge(user, { scopes: { organisations, networks } });
}

const listUsers = async (payload, message) => {
  logger.debug('Listing all users', { payload, message });
  return userRepo.findByIds(payload.userIds);
};

exports.getScoped = getScoped;
exports.getUser = getUser;
exports.getUserWithNetworkScope = getUserWithNetworkScope;
exports.list = listUsers;
exports.listUsersWithNetworkScope = listUsersWithNetworkScope;
