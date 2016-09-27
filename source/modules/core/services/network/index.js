import Promise from 'bluebird';
import { differenceBy, flatten, map } from 'lodash';
import * as integrationsAdapter from '../../../../shared/utils/integrations-adapter';
import * as userService from '../user';
import * as networkRepo from '../../../../shared/repositories/network';
export const listNetworksForCurrentUser = (payload, message) => {
  return message.credentials.Networks;
};

const getNetworks = async (url) => {
  return await integrationsAdapter.pristineNetworks(url);
};

/**
 * Retrieve prisinte networks from an integration.
 * @method listPristineNetworks
 * @return {Promise} Promise containing collection of network
 * with integrationName and admins for the network.
 */
export const listPristineNetworks = async () => {
  const baseUrl = 'https://partner2.testpmt.nl/rest.php';
  const clients = await integrationsAdapter.clients(baseUrl);

  const networksFromIntegration = flatten(await Promise.map(clients,
    (client) => getNetworks(client.externalId)));
  const networks = await networkRepo.findAll({ attributes: ['externalId'] });
  const pristineNetworks = differenceBy(networksFromIntegration, networks, 'externalId');
  const pristineSelectableNetworks = await Promise.map(pristineNetworks,
    async (pristineNetwork) => {
      const network = { ...pristineNetwork };
      const admins = await integrationsAdapter.adminsFromPristineNetworks(network.externalId);
      network.admins = admins;

      return network;
    });

  return pristineSelectableNetworks;
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
