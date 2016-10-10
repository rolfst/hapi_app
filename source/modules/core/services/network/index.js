import Promise from 'bluebird';
import { flatten, map, pick, get, find } from 'lodash';
import configurationMail from '../../../../shared/mails/configuration-invite';
import * as mailer from '../../../../shared/services/mailer';
import * as integrationsAdapter from '../../../../shared/utils/integrations-adapter';
import * as networkRepo from '../../repositories/network';
import * as userRepo from '../../repositories/user';
import * as importService from '../../../integrations/services/import';
import * as userService from '../user';
import * as impl from './implementation';

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

  const pristineNetworks = impl.filterExistingNetworks(networksFromIntegration);
  const pristineNetworksWithAdmins = await Promise.map(
    pristineNetworks, impl.mergeAdminsIntoPristineNetwork);

  return pristineNetworksWithAdmins;
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

const selectUser = (users, userId) => find(users, (user) => user.externalId === userId);

/**
 * Retrieve active users that belong to the network.
 * @param {object} payload - Object containing payload data
 * @param {object} message - Object containing meta data
 * @param {object} message.network - The prefetched network
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method listNetwork
 * @return {Promise} Promise containing collection of users
 */
export const listNetwork = async (payload, message) => {
  return message.network;
};

/**
 * imports a prinstine network into the system. it notifies the administrator of that
 * network about further action he can take.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.externalId - the external id of the prisinte network
 * @param {string} payload.name - the name of the pristine network
 * @param {string} payload.integrationName - the name of the integration the network
 * will be a part of
 * @param {string} payload.username - the username of the administrator
 * @param {string} payload.firstName - the firstname of the administrator
 * @param {string} payload.lastName - the lastname of the administrator
 * @param {string} payload.dateOfBirth - the birthdate of the administrator in (YY-MM-DD)
 * @param {string} payload.email - the emailaddress of the administrator
 * @param {string} payload.phoneNum - the phonenumber of the administrator
 * @param {string} payload.userId - the external userId of the administrator
 * @param {boolean} payload.isAdmin - state of the the administrator
 * @param {boolean} payload.isActive - activestate of the the administrator
 * @param {string} payload.teamId - external team id of the administrator
 * @method importPristiniNetwork
 * @return null
 * @throws {exception} - Exception  network already exists 401
 */
export const importPristineNetwork = async (payload) => {
  const networkPayload = pick(payload, ['name', 'externalId']);
  const integrationName = payload.integrationName;

  const usersFromNetwork = await integrationsAdapter.usersFromPristineNetwork(
    networkPayload.externalId);
  const admin = selectUser(usersFromNetwork, get(payload, 'userId'));
  const user = await userRepo.createUser({ ...admin });

  await impl.assertTheNetworkIsNotImportedYet(networkPayload);
  const newNetwork = await networkRepo.createIntegrationNetwork({
    userId: user.id,
    externalId: networkPayload.externalId,
    name: networkPayload.name,
    integrationName,
  });

  await importService.importNetwork({ networkId: newNetwork.id });
  mailer.send(configurationMail(newNetwork, user));
};
