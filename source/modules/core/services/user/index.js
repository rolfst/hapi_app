import { map, find } from 'lodash';
import Promise from 'bluebird';
import * as userRepo from '../../repositories/user';
import * as networkService from '../../services/network';
import * as networkRepo from '../../repositories/network';
import * as impl from './implementation';


/**
 * Retrieve user without network scope
 * @param {object} payload - Object containing payload data
 * @param {number} payload.userId - The id for the user to find
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.network - The network associated with the request
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method getUser
 * @return {User} Returning User model
 */
export const getUser = async (payload) => {
  return userRepo.findUserById(payload.userId);
};

/**
 * Retrieve multiple users by id with network scope
 * @param {object} payload - Object containing payload data
 * @param {array} payload.userIds - The ids for the user to find
 * @param {string} payload.networkId - The ids for the network to find the users in
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.network - The network associated with the request
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method listUsersWithNetworkScope
 * @return {Promise} Promise containing collection of users
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
      isActive: metaData.deletedAt === null,
      integrationAuth: !!metaData.userToken,
    };
  });
};

/**
 * Retrieve user with network scope
 * @param {object} payload - Object containing payload data
 * @param {number} payload.id - The id for the user to find
 * @param {number} payload.networkId - The id of network to apply scope
 * @method getUserWithNetworkScope
 * @return {Promise} Promise containing collection of users
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
