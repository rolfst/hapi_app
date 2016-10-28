import Promise from 'bluebird';
import { find, flatten, map, filter, get, pick } from 'lodash';
import createError from '../../../../shared/utils/create-error';
import createAdapter from '../../../../shared/utils/create-adapter';
import configurationMail from '../../../../shared/mails/configuration-invite';
import configurationMailNewAdmin from '../../../../shared/mails/configuration-invite-newadmin';
import * as mailer from '../../../../shared/services/mailer';
import * as integrationsAdapter from '../../../../shared/utils/integrations-adapter';
import * as passwordUtil from '../../../../shared/utils/password';
import * as networkRepo from '../../repositories/network';
import * as userRepo from '../../repositories/user';
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

  await impl.assertThatUserBelongsToTheNetwork(
    network.id,
    message.credentials.id,
  );

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

  await impl.assertTheNetworkIsNotImportedYet({ id: network.id });
  if (!network.externalId) throw createError('10001');

  const adapter = createAdapter(network, [], { proceedWithoutToken: true });
  const externalUsers = await adapter.fetchUsers(network.externalId);

  try {
    const admin = await userRepo.findUserByUsername(username);

    network = await impl.updateSuperUserForNetwork(admin, networkId);
    mailConfig = configurationMail(network, admin);
  } catch (e) {
    const selectedAdmin = find(externalUsers, (user) => {
      return user.email === username;
    });

    if (!selectedAdmin) throw createError('10006');

    const password = passwordUtil.plainRandom();
    const superUser = await userRepo.createUser({ ...selectedAdmin, password });

    network = await impl.updateSuperUserForNetwork(superUser, networkId);
    mailConfig = configurationMailNewAdmin(network, superUser, password);
  }

  const [externalTeams, internalUsers] = await Promise.all([
    adapter.fetchTeams(),
    userRepo.findAllUsers(),
  ]);

  const users = await impl.importUsers(internalUsers, externalUsers, network);
  const teams = await impl.importTeams(externalTeams, network);

  await impl.addUsersToTeam(users, teams, externalUsers);
  await networkRepo.setImportDateOnNetworkIntegration(network.id);

  mailer.send(mailConfig);
};
