const R = require('ramda');
const createError = require('../../../../shared/utils/create-error');
const networkRepo = require('../../repositories/network');
const organisationRepo = require('../../repositories/organisation');
const userService = require('../user');
const userRepo = require('../../repositories/user');
const teamService = require('../team');
const { ERoleTypes } = require('../../definitions');

/**
 * @module modules/core/services/network
 */

const logger = require('../../../../shared/services/logger')('CORE/service/network');

/**
 * Verifies if a user has a specific role in a network (or is organisation admin)
 * @param requestedRole - The role to check for
 * @param networkId - The id of the organisation
 * @param userId - The id of the user
 * @method userHasRoleInNetwork
 * @returns {external:Promise.<Boolean>}
 */
const userHasRoleInNetwork = async (networkId, userId, requestedRole = ERoleTypes.ANY) => {
  const network = await networkRepo.findNetworkById(networkId);
  if (!network) throw createError('404', 'Network not found.');

  const networkUser = await networkRepo.getNetworkUser(networkId, userId);
  if (networkUser) {
    if (requestedRole === ERoleTypes.ANY || networkUser.roleType === requestedRole) return true;
  }

  // We didn't find a networkUser with the right credentials, but an organisation admin is also ok
  const organisationUser = await organisationRepo.getPivot(userId, network.organisationId);
  if (!organisationUser) return false;

  return organisationUser.roleType === ERoleTypes.ADMIN;
};

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

const updateUserInNetwork = async (payload) => {
  const userWhiteList = [
    'firstName',
    'lastName',
    'email',
    'password',
    'dateOfBirth',
    'phoneNum',
  ];

  const networkUserWhiteList = [
    'roleType',
    'invitedAt',
    'deletedAt',
  ];

  // TODO: verify this user is actually in the network or organisation

  const userFields = R.pick(userWhiteList, payload);
  const networkUserFields = R.pick(networkUserWhiteList, payload);

  const updateUserRecord = () => {
    if (R.isEmpty(userFields)) return Promise.resolve();

    return userRepo.updateUser(payload.userId, userFields);
  };

  const updateOrganisationUserRecord = () => {
    if (R.isEmpty(networkUserFields)) return Promise.resolve();

    return userRepo
      .updateNetworkLink(
        { userId: payload.userId, networkId: payload.networkId },
        networkUserFields
      );
  };

  await updateUserRecord().then(updateOrganisationUserRecord);

  return userService.getUserWithNetworkScope({
    id: payload.userId,
    networkId: payload.networkId,
  });
};

exports.ERoleTypes = ERoleTypes;

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
exports.updateUserInNetwork = updateUserInNetwork;
exports.userHasRoleInNetwork = userHasRoleInNetwork;
