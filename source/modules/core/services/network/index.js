import { map } from 'lodash';
import * as userService from '../user';
import * as networkRepo from '../../../../shared/repositories/network';

export const listNetworksForCurrentUser = (payload, message) => {
  return message.credentials.Networks;
};

/**
 * Retrieve active users that belong to the network.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.networkId - The id of the network
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method listActiveUsersForNetwork
 * @return {Promise} Promise containing collection of users
 */
export const listActiveUsersForNetwork = async (payload, message) => {
  const network = await networkRepo.findNetworkById(payload.networkId);
  const usersFromNetwork = await networkRepo.findActiveUsersForNetwork(network);

  return userService.listUsers({ userIds: map(usersFromNetwork, 'id') }, message);
};
