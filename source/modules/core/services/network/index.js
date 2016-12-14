import Promise from 'bluebird';
import { find, flatten, map, filter, get, pick } from 'lodash';
import { createAdapter } from '../../../../shared/utils/create-adapter';
import * as Logger from '../../../../shared/services/logger';
import createError from '../../../../shared/utils/create-error';
import configurationMail from '../../../../shared/mails/configuration-invite';
import configurationMailNewAdmin from '../../../../shared/mails/configuration-invite-newadmin';
import * as mailer from '../../../../shared/services/mailer';
import * as integrationsAdapter from '../../../../shared/utils/integrations-adapter';
import * as passwordUtil from '../../../../shared/utils/password';
import * as networkRepo from '../../repositories/network';
import * as userRepo from '../../repositories/user';
import * as userService from '../user';
import * as impl from './implementation';

const logger = Logger.createLogger('CORE/service/network');

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

export const listAdminsFromNetwork = async (payload) => {
  const network = await networkRepo.findNetworkById(payload.networkId);

  if (!network) throw createError('404');

  const adapter = createAdapter(network, [], { proceedWithoutToken: true });
  const externalUsers = await adapter.fetchUsers(network.externalId);

  return filter(externalUsers, 'isAdmin');
};

/**
 * Retrieve active users that belong to the network.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.networkId - The id of the network to find the users in
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method listActiveUsersForNetwork
 * @return {Promise} Promise containing collection of users
 */
export const listActiveUsersForNetwork = async (payload, message) => {
  const network = await networkRepo.findNetworkById(payload.networkId);
  const usersFromNetwork = await networkRepo.findUsersForNetwork(network.id);

  return userService.listUsersWithNetworkScope({
    userIds: map(usersFromNetwork, 'id'),
    networkId: payload.networkId,
  }, message);
};

/**
 * Retrieve users that belong to the network.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.networkId - The id of the network
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method listAllUsersForNetwork
 * @return {Promise} Promise containing collection of users
 */
export const listAllUsersForNetwork = async (payload, message) => {
  const network = await networkRepo.findNetworkById(payload.networkId);
  const usersFromNetwork = await networkRepo.findAllUsersForNetwork(network.id);

  return userService.listUsersWithNetworkScope({
    userIds: map(usersFromNetwork, 'id'),
    networkId: payload.networkId,
  }, message);
};

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

/*
 * import network. The import will assign a user as administrator for that network.
 * @param {object} payload = Obect containing payload data
 * @param {string} payload.username - the username of the user in both external system
 * @method importNetwork
 * @return {Promise} Promise containing the imported network
 */
export const importNetwork = async (payload) => {
  const username = get(payload, 'external_username');
  const networkId = get(payload, 'networkId');
  let network = await networkRepo.findNetworkById(networkId);
  let mailConfig;

  if (!network) throw createError('404', 'Network not found.');
  if (!network.externalId) throw createError('10001');
  await impl.assertTheNetworkIsNotImportedYet(network.id);

  const adapter = createAdapter(network, [], { proceedWithoutToken: true });
  const externalUsers = await adapter.fetchUsers(network.externalId);
  const admin = await userRepo.findUserByUsername(username);
  const externalAdmin = find(externalUsers, (user) => {
    return user.username === username;
  });

  if (admin) {
    network = await impl.updateSuperUserForNetwork(admin.id, networkId);

    await networkRepo.addUser({
      userId: admin.id,
      networkId: network.id,
      isActive: true,
      externalId: externalAdmin.externalId,
      roleType: 'ADMIN',
    });

    mailConfig = configurationMail(network, admin);
  } else {
    if (!externalAdmin) throw createError('10006');

    const password = passwordUtil.plainRandom();
    const superUser = await userRepo.createUser({ ...externalAdmin, password });
    await networkRepo.addUser({
      userId: superUser.id,
      networkId: network.id,
      isActive: true,
      externalId: externalAdmin.externalId,
      roleType: 'ADMIN',
    });

    network = await impl.updateSuperUserForNetwork(superUser.id, networkId);
    mailConfig = configurationMailNewAdmin(network, superUser, password);
  }

  const externalTeams = await adapter.fetchTeams();
  logger.info('Importing users for network', { networkId: network.id });
  await impl.importUsers(externalUsers, network.id);
  logger.info('Importing teams for network', { networkId: network.id });
  const teams = await impl.importTeams(externalTeams, network);

  const importedUsers = await networkRepo.findAllUsersForNetwork(networkId);
  await impl.addUsersToTeam(importedUsers, teams, externalUsers);
  await networkRepo.setImportDateOnNetworkIntegration(network.id);

  mailer.send(mailConfig);
};

/**
 * @param {object} payload - Obect containing payload data
 * @param {string} payload.externalUsers - the users in the external system
 * @param {object} payload.network - the network where to import to
 * @param {object} message - Object containing meta data
 * @param {object} message.network - The prefetched network
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method importUsers
 * @return {Promise} Promise containing the imported network
 */
export const importUsers = async (payload, message) => {
  const { externalUsers, network } = payload;

  return impl.importUsers(externalUsers, network.id, message);
};

/**
 * @param {object} payload = Obect containing payload data
 * @param {string} payload.externalUsers - the username of the user in both external system
 * @param {string} payload.network - the network where to import to
 * @param {object} message - Object containing meta data
 * @param {object} message.network - The prefetched network
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method updateUserForNetwork
 * @return {Promise} Promise containing updated userIds
 */
export const updateUsersForNetwork = async (payload, message) => {
  const { externalUsers, networkId } = payload;

  return impl.updateUsersForNetwork(externalUsers, networkId, message);
};

/**
 * @param {object} payload = Obect containing payload data
 * @param {string} payload.integrationName - the integration name where to list the networks for
 * @param {object} message - Object containing meta data
 * @param {object} message.network - The prefetched network
 * @method listNetworksForIntegration
 * @return {Promise} Promise containing updated userIds
 */
export const listNetworksForIntegration = async (payload) => {
  return networkRepo.findNetworksForIntegration(payload.integrationName);
};

/**
 * @param {object} payload - Obect containing payload data
 * @param {string} payload.externalTeams - the teams in the external system
 * @param {object} payload.network - the network where to import to
 * @param {object} message - Object containing meta data
 * @param {object} message.network - The prefetched network
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method importUsers
 * @return {Promise} Promise containing the imported network
 */
export const importTeams = async (payload, message) => {
  const { externalTeams, network } = payload;

  return impl.importTeams(externalTeams, network, message);
};

/**
 * @param {object} payload = Obect containing payload data
 * @param {array} payload.externalTeams - the teams in both external system and internal system
 * the relation can be put by the externalId
 * @param {string} payload.network - the network where to import to
 * @param {object} message - Object containing meta data
 * @param {object} message.network - The prefetched network
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method updateUserForNetwork
 * @return {Promise} Promise containing updated userIds
 */
export const updateTeamsForNetwork = async (payload, message) => {
  const { externalTeams, networkId } = payload;

  return impl.updateTeamsForNetwork(externalTeams, networkId, message);
};

/**
 * Retrieve teams that belong to the network.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.networkId - The id of the network
 * @method listTeamsForNetwork
 * @return {Promise} Promise containing collection of teams
 */
export const listTeamsForNetwork = async (payload) => {
  return networkRepo.findTeamsForNetwork(payload.networkId);
};

export const addUsersToTeams = async (payload, message) => {
  const { externalUserIds } = payload;
  const internalUsers = await listActiveUsersForNetwork(payload, message);
  const teams = await listTeamsForNetwork(payload, message);

  await impl.addUsersToTeam(map(internalUsers, 'id'), teams, externalUserIds);
};
