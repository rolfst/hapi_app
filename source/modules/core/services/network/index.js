import Promise from 'bluebird';
import { flatten, map, filter, pick } from 'lodash';
import R from 'ramda';
import { createAdapter } from '../../../../shared/utils/create-adapter';
import * as Logger from '../../../../shared/services/logger';
import createError from '../../../../shared/utils/create-error';
import * as integrationsAdapter from '../../../../shared/utils/integrations-adapter';
import * as networkRepo from '../../repositories/network';
import * as userService from '../user';
import * as teamService from '../team';
import * as impl from './implementation';

/**
 * @module modules/core/services/network
 */

const logger = Logger.getLogger('CORE/service/network');

/**
 * Create a new network.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.userId - The id of the owner of the network
 * @param {string} payload.name - The name of the network
 * @param {string} payload.externalId - The external id of the network
 * @param {string} payload.integrationName - The integration that the network should have
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Network>} {@link module:modules/core~Network Network} -
 * new network object
 */
export const create = async (payload, message) => {
  logger.info('Creating network', { payload, message });

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
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method addUserToNetwork
 * @return {external:Promise.<Network>} {@link module:modules/core~User User} -
 * Promise containing a User
 */
export const addUserToNetwork = async (payload, message) => {
  logger.info('Adding user to network', { payload, message });

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
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listPristineNetworks
 * @return {external:Promise} -
 * Promise containing collection of a pristine network with integrationName
 * and admins for the network.
 */
export const listPristineNetworks = async (payload, message) => {
  logger.info('Listing all pristine networks', { payload, message });

  const baseUrl = 'https://partner2.testpmt.nl/rest.php';
  const clients = await integrationsAdapter.clients(baseUrl);
  const externalIds = map(clients, 'externalId');

  const networksFromIntegration = flatten(await Promise.map(externalIds, getNetworks));
  const pristineNetworks = impl.filterExistingNetworks(networksFromIntegration, message);
  const pristineNetworksWithAdmins = await Promise.map(
    pristineNetworks,
    (pristineNetwork) => impl.mergeAdminsIntoPristineNetwork(pristineNetwork, message));

  return pristineNetworksWithAdmins;
};

/**
 * retrieves Admins from network
 * @param {object} payload
 * @param {string} payload.networkId
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listAdminsFromNetwork
 * @return {external:Promise} Promise containing collection of a pristine network admins
 */
export const listAdminsFromNetwork = async (payload, message) => {
  logger.info('listing Admins From Network', { payload, message });
  const network = await networkRepo.findNetworkById(payload.networkId);

  if (!network) throw createError('404');

  const adapter = await createAdapter(network, 0, { proceedWithoutToken: true });
  const externalUsers = await adapter.fetchUsers(network.externalId);

  return filter(externalUsers, 'isAdmin');
};

/**
 * Retrieve active users that belong to the network.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.networkId - The id of the network to find the users in
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listActiveUsersForNetwork
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User} -
 * Promise containing collection of users
 */
export const listActiveUsersForNetwork = async (payload, message) => {
  logger.info('Listing active users for network', { payload, message });

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
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listAllUsersForNetwork
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User} -
 * Promise containing collection of users
 */
export const listAllUsersForNetwork = async (payload, message) => {
  logger.info('List all users for network', { payload });

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
 * @param {number} payload.networkId - The id of the network to get
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getNetwork
 * @return {external:Promise.<Network>} {@link module:modules/core~Network Network} -
 * Promise containing network
 */
export const getNetwork = async (payload, message) => {
  const network = await networkRepo.findNetworkById(payload.networkId);

  if (!network) throw createError('404');

  await impl.assertThatUserBelongsToTheNetwork(network.id, message.credentials.id);

  return network;
};

/**
 * List network where user belongs to
 * @param {object} payload - Object containing payload data
 * @param {number} payload.id - The id of the user
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listNetworksForUser
 * @return {external:Promise.<Network>} {@link module:modules/core~Network Network} -
 * Promise containing a collections networks
 */
export const listNetworksForUser = async (payload) => {
  logger.info('List all networks for user', { payload });

  return networkRepo.findNetworksForUser(payload.id);
};

/**
 * Importing a network via the data from the integration partner
 * @param {object} payload - Obect containing payload data
 * @param {string} payload.external_username - The user that'll be assigned as owner of the network
 * @param {string} payload.networkId - The network to import
 * @method importNetwork
 * @return {external:Promise.<Network>} {@link module:modules/core~Network Network} -
 * Promise containing the imported network
 */
export const importNetwork = async (payload) => {
  const username = payload.external_username;
  const network = await networkRepo.findNetworkById(payload.networkId);

  if (!network) throw createError('404', 'Network not found.');
  if (!network.externalId) throw createError('10001');
  await impl.assertTheNetworkIsNotImportedYet(network.id);

  logger.info('Started executing import script', { ...payload });

  // We are moving to the impl so we are able to execute the business logic asynchronously.
  // Else the client will timeout. If we do not do this, our assertion/errors will not
  // be send to the handler as response to the client.
  impl.importNetwork(network, username);
};

/**
 * @param {object} payload - Obect containing payload data
 * @param {string} payload.externalUsers - the users in the external system
 * @param {object} payload.network - the network where to import to
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method importUsers
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User} -
 * Promise containing the imported users
 */
export const importUsers = async (payload, message) => {
  logger.info('Importing external users', { payload, message });

  const { externalUsers, network } = payload;

  return impl.importUsers(externalUsers, network.id, message);
};

/**
 * @param {object} payload - Object containing payload data
 * @param {string} payload.externalUsers - the username of the user in both external system
 * @param {string} payload.network - the network where to import to
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method updateUserForNetwork
 * @return {external:Promise.<String[]>} Promise containing updated userIds
 */
export const updateUsersForNetwork = async (payload, message) => {
  logger.info('Updating external users in network', { payload, message });

  const { externalUsers, networkId } = payload;

  return impl.updateUsersForNetwork(externalUsers, networkId, message);
};

/**
 * @param {object} payload - Obect containing payload data
 * @param {string} payload.externalTeams - the teams in the external system
 * @param {object} payload.network - the network where to import to
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method importTeams
 * @return {external:Promise.<Team[]>} {@link module:modules/core~Team Team} -
 * Promise containing the imported teams
 */
export const importTeams = async (payload, message) => {
  logger.info('Importing the external teams in the network', { payload, message });

  const { externalTeams, network } = payload;

  return impl.importTeams(externalTeams, network, message);
};

/**
 * @param {object} payload - Object containing payload data
 * @param {array} payload.externalTeams - the teams in both external system and internal system
 * the relation can be put by the externalId
 * @param {string} payload.network - the network where to import to
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method updateTeamForNetwork
 * @return {external:Promise.<Team[]>} {@link module:modules/core~Team Team} -
 * Promise containing updated teams
 */
export const updateTeamsForNetwork = async (payload, message) => {
  logger.info('Updating the external teams in the network', { payload, message });

  const { externalTeams, networkId } = payload;

  return impl.updateTeamsForNetwork(externalTeams, networkId, message);
};

/**
 * Retrieve teams that belong to the network.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.networkId - The id of the network
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listTeamsForNetwork
 * @return {external:Promise.<Team[]>} {@link module:modules/core~Team Team} -
 * Promise containing updated teams
 */
export const listTeamsForNetwork = async (payload, message) => {
  const result = await networkRepo.findTeamsForNetwork(payload.networkId);
  logger.info('List teams for network', {
    payload, teamCount: result.length, message: message || null });

  return teamService.list({ teamIds: R.pluck('id', result) }, message);
};

/**
 * Adds Users to the teams that belong to a network.
 * @param {object} payload - Object containing payload data
 * @param {number} payload.networkId - The id of the network
 * @param {number} payload.externalUserIds  - The externalIds ids of the users to be added
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method addUsersToTeams
 * @return {external:Promise.<Team[]>} {@link module:modules/core~Team Team} -
 * Promise containing updated teams
 */
export const addUsersToTeams = async (payload, message) => {
  const { externalUserIds } = payload;
  const internalUsers = await listActiveUsersForNetwork(payload, message);
  const teams = await listTeamsForNetwork(payload, message);

  await impl.addUsersToTeam(map(internalUsers, 'id'), teams, externalUserIds);
};
