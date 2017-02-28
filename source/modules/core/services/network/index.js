import Promise from 'bluebird';
import R from 'ramda';
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

  const whitelistAttrs = R.pick(['userId', 'name', 'externalId', 'integrationName'], payload);

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
 * @return {external:Promise.<NetworkUser>} {@link module:shared~NetworkUser NetworkUser}
 * Promise containing a User
 */
export const addUserToNetwork = async (payload, message) => {
  logger.info('Adding user to network', { payload, message });

  const attrsWhitelist = ['userId', 'networkId', 'externalId', 'userToken'];
  const attributes = {
    ...R.pick(attrsWhitelist, payload),
    roleType: payload.roleType || 'EMPLOYEE',
    deletedAt: payload.active === false ? new Date() : null,
  };

  return networkRepo.addUser(attributes);
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
  const externalIds = R.pluck('externalId', clients);

  const networksFromIntegration = await R.pipeP(
    ids => Promise.map(ids, integrationsAdapter.pristineNetworks),
    R.flatten)(externalIds);

  const pristineNetworks = impl.filterExistingNetworks(networksFromIntegration, message);
  const pristineNetworksWithAdmins = await Promise.map(pristineNetworks, (pristineNetwork) =>
    impl.mergeAdminsIntoPristineNetwork(pristineNetwork, message));

  return pristineNetworksWithAdmins;
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
  if (!network) throw createError('404', 'Network not found.');

  return networkRepo.findUsersForNetwork(network.id);
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
    userIds: R.pluck('id', usersFromNetwork),
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
  logger.info('Retrieving single network', { payload, message });
  const network = await networkRepo.findNetworkById(payload.networkId);

  if (!network) throw createError('404', 'Network not found.');

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
