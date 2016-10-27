import Promise from 'bluebird';
import { flatten, map, pick, get, find } from 'lodash';
import configurationMail from '../../../../shared/mails/configuration-invite';
import createError from '../../../../shared/utils/create-error';
import * as passwordUtils from '../../../../shared/utils/password';
import * as mailer from '../../../../shared/services/mailer';
import * as integrationsAdapter from '../../../../shared/utils/integrations-adapter';
import * as networkRepo from '../../repositories/network';
import * as userRepo from '../../repositories/user';
import * as importService from '../../../integrations/services/import';
import * as userService from '../user';
import * as impl from './implementation';

/**
 * Create a new network.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.userId - The id of the owner of the network
 * @param {number} payload.name - The name of the network
 * @param {string} payload.externalId - The external id of the network
 * @param {string} payload.integrationName - The integration that the network should have
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method create
 * @return {Promise} Promise new network object
 */
export const create = async (payload) => {
  const whitelistAttrs = pick(payload, 'userId', 'name', 'externalId', 'integrationName');

  if (payload.integrationName) {
    return networkRepo.createIntegrationNetwork(whitelistAttrs);
  }

  return networkRepo.createNetwork(payload.userId, payload.name);
};

/**
 * Adding an user to a network.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.networkId - The id of the network
 * @param {number} payload.userId - The id of the user to add
 * @param {string} payload.roleType - The role type for the user
 * @param {string} payload.externalId - The external id for the user
 * @param {string} payload.userToken - The user token of the user to add
 * @param {boolean} payload.active - Flag if the user is active
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method addUserToNetwork
 * @return {Promise} Promise containing collection of users
 */
export const addUserToNetwork = async (payload) => {
  const attrsWhitelist = ['userId', 'networkId', 'externalId', 'userToken'];
  const attributes = {
    ...pick(payload, attrsWhitelist),
    roleType: payload.roleType || 'EMPLOYEE',
    deletedAt: payload.active === false ? new Date() : null,
  };

  return networkRepo.addUser(attributes);
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
  const externalIds = map(clients, 'externalId');

  const networksFromIntegration = flatten(await Promise.map(externalIds, getNetworks));
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
  const usersFromNetwork = await networkRepo.findUsersForNetwork(network.id);

  return userService.listUsersWithNetworkScope({ userIds: map(usersFromNetwork, 'id') }, message);
};

const selectUser = (users, userId) => find(users, (user) => user.externalId === userId);

/**
 * Retrieve a single network;
 * @param {object} payload - Object containing payload data
 * @param {number} payload.id - The id of the network to get
 * @param {object} message - Object containing meta data
 * @param {object} message.network - The prefetched network
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method getNetwork
 * @return {Promise} Promise containing collection of users
 */
export const getNetwork = async (payload, message) => {
  const network = await networkRepo.findNetworkById(payload.id);

  if (!network) throw createError('404');

  await impl.assertThatUserBelongsToTheNetwork(network.id, message.credentials.id);

  return network;
};

/**
 * List network where user belongs to
 * @param {object} payload - Object containing payload data
 * @param {number} payload.id - The id of the user
 * @param {object} message - Object containing meta data
 * @param {object} message.network - The prefetched network
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method listNetworksForUser
 * @return {Promise} Promise containing collection of networks
 */
export const listNetworksForUser = async (payload) => {
  return networkRepo.findAllContainingUser(payload.id);
};

/**
 * imports a pristine network into the system. it notifies the administrator of that
 * network about further action he can take.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.externalId - the external id of the prisinte network
 * @param {string} payload.name - the name of the pristine network
 * @param {string} payload.integrationName - the name of the integration the network
 * will be a part of
 * @param {string} payload.userId - the external userId of the administrator
 * @method importPristineNetwork
 * @return null
 * @throws {exception} - Exception  network already exists 401
 */
export const importPristineNetwork = async (payload) => {
  const networkPayload = pick(payload, ['name', 'externalId']);

  await impl.assertTheNetworkIsNotImportedYet(networkPayload);

  const integrationName = payload.integrationName;
  const usersFromNetwork = await integrationsAdapter.usersFromPristineNetwork(
    networkPayload.externalId);
  const admin = selectUser(usersFromNetwork, get(payload, 'userId'));
  const user = await userRepo.createUser({ ...admin, password: passwordUtils.plainRandom() });

  const newNetwork = await networkRepo.createIntegrationNetwork({
    integrationName,
    userId: user.id,
    name: networkPayload.name,
    externalId: networkPayload.externalId,
  });

  await importService.importNetwork({ networkId: newNetwork.id });
  mailer.send(configurationMail(newNetwork, user));
};
