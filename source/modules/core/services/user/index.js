import { map, find } from 'lodash';
import Promise from 'bluebird';
import * as userRepo from '../../repositories/user';
import * as networkService from '../../services/network';
import * as networkRepo from '../../repositories/network';
import * as impl from './implementation';

/**
 * @module modules/core/services/user
 */

/**
 * Retrieve user without network scope
 * @param {object} payload - Object containing payload data
 * @param {number} payload.userId - The id for the user to find
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getUser
 * @return {external:Promise.<User>} {@link module:modules/core~User User} model
 */
export const getUser = async (payload) => {
  return userRepo.findUserById(payload.userId);
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
export const listUsersWithNetworkScope = async (payload, message) => {
  const users = await userRepo.findUsersByIds(payload.userIds);
  const network = await networkService.getNetwork({ id: payload.networkId }, message);
  const metaDataList = await userRepo.findMultipleUserMetaDataForNetwork(
    map(users, 'id'), network.id);

  return Promise.map(users, async (user) => {
    const metaData = find(metaDataList, { userId: parseInt(user.id, 10) });

    return {
      ...user,
      function: !!metaData.deletedAt ?
        'Verwijderd' : await impl.createFunctionName(user.id, network),
      roleType: metaData.roleType,
      externalId: metaData.externalId,
      deletedAt: metaData.deletedAt,
      integrationAuth: !!metaData.userToken,
    };
  });
};

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
export const getUserWithNetworkScope = async (payload) => {
  const user = await userRepo.findUserById(payload.id);
  const network = await networkRepo.findNetworkById(payload.networkId);
  const metaData = await userRepo.findUserMetaDataForNetwork(user.id, network.id);

  return {
    ...user,
    function: !!metaData.deletedAt ?
      'Verwijderd' : await impl.createFunctionName(user.id, network),
    roleType: metaData.roleType,
    externalId: metaData.externalId,
    isActive: metaData.deletedAt === null,
    integrationAuth: !!metaData.userToken,
  };
};
