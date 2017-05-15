const R = require('ramda');
const createError = require('../../../../shared/utils/create-error');
const networkRepo = require('../../repositories/network');
const userService = require('../user');
const teamService = require('../team');
const { ERoleTypes } = require('../../definitions');

/**
 * @module modules/core/services/network
 */

const logger = require('../../../../shared/services/logger')('CORE/service/network');

/**
 * Retrieve a single network;
 * @param {object} payload - Object containing payload data
 * @param {number} payload.networkId - The id of the network to get
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method get
 * @return {external:Promise.<Network>} {@link module:modules/core~Network Network} -
 * Promise containing network
 */
const get = async (payload, message) => {
  logger.debug('Retrieving single network', { payload, message });
  const network = await networkRepo.findNetworkById(payload.networkId);

  if (!network) throw createError('404', 'Network not found');

  return network;
};

const list = async (payload, message) => {
  logger.debug('Listing networks', { payload, message });

  const whereConstraint = {};
  if (payload.networkIds) whereConstraint.id = { $in: payload.networkIds };
  if (payload.organisationId) whereConstraint.organisationId = payload.organisationId;

  return networkRepo.findWhere(whereConstraint);
};

/**
 * Create a new network.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.userId - The id of the owner of the network
 * @param {string} payload.name - The name of the network
 * @param {string} [payload.externalId] - The external id of the network
 * @param {string} [payload.integrationName] - The integration that the network should have
 * @param {string} [payload.organisationId] - The id of the rganisation the network belongs to
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Network>} {@link module:modules/core~Network Network} -
 * new network object
 */
const create = async (payload, message) => {
  logger.debug('Creating network', { payload, message });

  const whitelistAttrs = R.pick(['organisationId', 'userId', 'name', 'externalId', 'integrationName'], payload);

  if (payload.integrationName) {
    return networkRepo.createIntegrationNetwork(whitelistAttrs);
  }

  return networkRepo.createNetwork(payload.userId, payload.name, null, payload.organisationId);
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
const addUserToNetwork = async (payload, message) => {
  logger.debug('Adding user to network', { payload, message });

  const attrsWhitelist = ['userId', 'networkId', 'externalId', 'userToken'];
  const attributes = R.merge(
    R.pick(attrsWhitelist, payload), {
      roleType: payload.roleType || 'EMPLOYEE',
      deletedAt: payload.active === false ? new Date() : null,
    });

  return networkRepo.addUser(attributes);
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
const listActiveUsersForNetwork = async (payload, message) => {
  logger.debug('Listing active users for network', { payload, message });

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
const listAllUsersForNetwork = async (payload, message) => {
  logger.debug('List all users for network', { payload });

  const network = await networkRepo.findNetworkById(payload.networkId);
  const usersFromNetwork = await networkRepo.findAllUsersForNetwork(network.id);

  return userService.listUsersWithNetworkScope({
    userIds: R.pluck('id', usersFromNetwork),
    networkId: payload.networkId,
  }, message);
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
const listNetworksForUser = async (payload) => {
  logger.debug('List all networks for user', { payload });

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
const listTeamsForNetwork = async (payload, message) => {
  const result = await networkRepo.findTeamsForNetwork(payload.networkId);

  logger.debug('List teams for network', {
    payload,
    teamCount: result.length,
    message: message || null,
  });

  const teams = await teamService.list({ teamIds: R.pluck('id', result) }, message);
  const userWithScope = await userService
    .getUserWithNetworkScope({ id: message.credentials.id, networkId: payload.networkId }, message);

  if (userWithScope.roleType === ERoleTypes.EMPLOYEE) return R.filter(R.prop('isMember'), teams);

  return teams;
};

/**
 * Update a network
 * @param {object} payload - Object containing payload data
 * @param {string} payload.networkId - The id of the network
 * @param {string} payload.organisationId
 * @param {string} payload.name
 * @param {string} payload.externalId
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method update
 * @return {external:Promise.<Network>} {@link module:modules/core~Network Network}
 */
const update = async (payload, message) => {
  logger.debug('Updating network', { payload, message });

  const UPDATE_PROPERTIES = ['organisationId', 'name', 'externalId'];
  return networkRepo.updateNetwork(payload.networkId, R.pick(UPDATE_PROPERTIES, payload));
};

const fetchOrganisationNetworks = (organisationId, networkIds) => {
  return networkRepo
    .findWhere({ organisationId, id: { $in: networkIds } });
};

const removeUser = (networkId, userId) => networkRepo.removeUser(networkId, userId);

const updateUser = (networkId, userId, attributes) =>
  networkRepo.updateUser(networkId, userId, attributes);

exports.fetchOrganisationNetworks = fetchOrganisationNetworks;
exports.listTeamsForNetwork = listTeamsForNetwork;
exports.listNetworksForUser = listNetworksForUser;
exports.listAllUsersForNetwork = listAllUsersForNetwork;
exports.get = get;
exports.list = list;
exports.create = create;
exports.addUserToNetwork = addUserToNetwork;
exports.listActiveUsersForNetwork = listActiveUsersForNetwork;
exports.removeUser = removeUser;
exports.update = update;
exports.updateUser = updateUser;
