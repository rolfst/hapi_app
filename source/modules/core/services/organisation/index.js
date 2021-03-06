const R = require('ramda');
const Promise = require('bluebird');
const createError = require('../../../../shared/utils/create-error');
const queryGenerator = require('../../../workflow/services/query-generator');
const workflowExcutor = require('../../../workflow/services/executor');
const { EConditionOperators } = require('../../../workflow/definitions');
const organisationRepository = require('../../repositories/organisation');
const userRepository = require('../../repositories/user');
const networkRepository = require('../../repositories/network');
const User = require('../../../authorization/utils/user-cache');
const networkService = require('../network');
const impl = require('./implementation');
const userService = require('../user');
const { ESEARCH_SELECTORS } = require('../../definitions');
const { ERoleTypes } = require('../../../authorization/definitions');
const prefetchCaches = require('../../../authorization/utils/prefetch-caches');

/**
 * @module modules/core/services/organisation
 */

const logger = require('../../../../shared/services/logger')('CORE/service/object');

const OPTIONS_WHITELIST = ['offset', 'limit'];
const createOptionsFromPayload = R.pick(OPTIONS_WHITELIST);

const selectUsers = async (organisationId, select, options) => {
  let condition = null;
  let query = null;
  switch (select) {
    case ESEARCH_SELECTORS.ADMIN:
      condition = { field: 'organisation_user.role_type', operator: EConditionOperators.EQUAL, value: ERoleTypes.ADMIN };
      break;
    case ESEARCH_SELECTORS.ACTIVE:
      condition = { field: 'organisation_user.is_active', operator: EConditionOperators.EQUAL, value: true };
      break;
    case ESEARCH_SELECTORS.INACTIVE:
      condition = { field: 'organisation_user.is_active', operator: EConditionOperators.EQUAL, value: false };
      break;
    default:
      condition = { field: 'organisation_user.last_active', operator: EConditionOperators.EQUAL, value: null };
      break;
  }

  query = queryGenerator(organisationId, [condition], options);
  const result = await workflowExcutor.executeQuery(query);

  return result;
};


/**
 * Verifies if a user has a specific role in an organisation
 * @param requestedRole - The role to check for
 * @param organisationId - The id of the organisation
 * @param userId - The id of the user
 * @method userHasRoleInOrganisation
 * @returns {external:Promise.<Boolean>}
 */
// TODO: this function should be very deprecated, FIX
const userHasRoleInOrganisation =
  async (organisationId, userId, requestedRole = ERoleTypes.ANY) => {
    logger.debug('Checking user role in organisation', { requestedRole, organisationId, userId });

    const organisation = await organisationRepository.findById(organisationId);
    if (!organisation) throw createError('404', 'Organisation not found.');

    const userMeta = await organisationRepository.getPivot(userId, organisationId);
    if (!userMeta) return false;

    if (requestedRole === ERoleTypes.ANY) return true;

    return userMeta.roleType === requestedRole;
  };

/**
 * Verifies if a user is an admin in a specific organisation
 * @param organisationId - The id of the organisation
 * @param userId - The id of the user
 * @method assertUserIsAdminInOrganisation
 * @returns {external:Promise.<Boolean>}
 */
const assertUserIsAdminInOrganisation = async (organisationId, userId) => {
  if (!await userHasRoleInOrganisation(organisationId, userId, ERoleTypes.ADMIN)) {
    throw createError('10020');
  }
};

/**
 * Creates an organisation
 * @param {object} payload
 * @param {string} payload.name
 * @param {string} payload.brandIcon
 * @param {Message} message {@link module:shared~Message message}
 * @method create
 * @return {external:Promise.<Organisation>} {@link module:modules/core~Organisation}
 */
const create = (payload, message) => {
  logger.debug('Creating organisation', { payload, message });

  return organisationRepository.create(R.pick(['name', 'brandIcon'], payload));
};

/**
 * Attach network to organisation
 * @param {object} payload
 * @param {string} payload.networkId
 * @param {string} payload.organisationId
 * @param {Message} message {@link module:shared~Message message}
 * @method create
 * @return {external:Promise}
 */
const attachNetwork = async (payload, message) => {
  logger.debug('Attaching network to organisation', { payload, message });

  const retVal = await networkService.update({
    networkId: payload.networkId,
    organisationId: payload.organisationId,
  }, message);

  prefetchCaches.invalidateNetworkCache(payload.networkId);

  User.filter((key, cachedUser) => {
    if (cachedUser.hasRoleInNetwork(payload.networkId)) {
      cachedUser.invalidateCache();
    }

    return false;
  });

  return retVal;
};

/**
 * Listing networks that belong to the organisation
 * @param {object} payload
 * @param {string} payload.organisationId
 * @param {Message} message {@link module:shared~Message message}
 * @method listNetworks
 * @return {external:Promise.<Network[]>} {@link module:modules/core~Network}
 */
const listNetworks = async (payload, message) => {
  logger.debug('List all network for organisation', { payload, message });

  await impl.assertThatOrganisationExists(payload.organisationId);
  await impl.assertThatUserIsMemberOfOrganisation(message.credentials.id, payload.organisationId);

  const networks = await networkService.list({ organisationId: payload.organisationId });
  const counts = await networkRepository.countsUsersInNetwork(R.pluck('id', networks))
    .then(R.reduce((acc, network) => R.assoc(network.id, network.usersCount, acc), {}));

  return R.map((network) => R.assoc('usersCount', counts[network.id] || 0, network), networks);
};

/**
 * Lists all teamids within an organisation
 * @param {object} payload
 * @param {string} payload.oranisationId - the organisation for which the teamIds need to be
 * retrieved
 * @returns {number[]}
 */
function listTeamIds(payload) {
  return organisationRepository.findTeamIds(payload.organisationId);
}

/**
 * Listing organisations for a user
 * @param {object} payload
 * @param {string} payload.userId - The id of the user to list organisations for
 * @param {array} payload.include - The includes on the organisation resource
 * @param {Message} message {@link module:shared~Message message}
 * @method listForUser
 * @return {external:Promise.<Organisation[]>} {@link module:modules/core~Organisation}
 */
const listForUser = async (payload, message) => {
  logger.debug('List all organisations for user', { payload, message });

  let organisations = await organisationRepository.findForUser(payload.userId);

  if (R.contains('networks', payload.include)) {
    organisations = await Promise.map(organisations, async (organisation) => {
      const networksForOrganisation = await listNetworks({
        organisationId: organisation.id }, message);

      return R.merge(organisation, { networks: networksForOrganisation });
    });
  }

  return organisations;
};

/**
 * Adding an user to organisation
 * @param {object} payload
 * @param {string} payload.organisationId - The id of the organisation
 * @param {string} payload.userId - The id of the user to add
 * @param {UserRoles} payload.roleType
 * @param {Message} message {@link module:shared~Message message}
 * @method addUser
 * @return {external:Promise.<boolean>}
 */
const addUser = async (payload, message) => {
  logger.debug('Adding user to organisation', { payload, message });

  await impl.assertThatOrganisationExists(payload.organisationId);
  await impl.assertThatUserIsAdminInOrganisation(message.credentials.id, payload.organisationId);

  return organisationRepository.addUser(payload.userId, payload.organisationId, payload.roleType);
};

/**
 * Add a function in an organisation
 * @param {object} payload
 * @param {number} payload.organisationId - The id of the orgonisation
 * @param {string} payload.name - The name of the function to add
 * @param {Message} message {@link module:shared~Message message}
 * @return {external:Promise.<OrganisationFunction>}
 */
const addFunction = async (payload, message) => {
  logger.debug('Adding function to organisation', { payload, message });

  await impl.assertThatOrganisationExists(payload.organisationId);
  await impl.assertThatUserIsAdminInOrganisation(message.credentials.id, payload.organisationId);

  return organisationRepository.addFunction(payload.organisationId, payload.name);
};

/**
 * Update a function in an organisation
 * @param {object} payload
 * @param {number} payload.organisationId - The id of the orgonisation
 * @param {string} payload.name - The name of the function to add
 * @param {Message} message {@link module:shared~Message message}
 * @return {external:Promise.<OrganisationFunction>}
 */
const updateFunction = async (payload, message) => {
  logger.debug('Updating function in organisation', { payload, message });

  await impl.assertThatOrganisationExists(payload.organisationId);
  await impl.assertThatUserIsAdminInOrganisation(message.credentials.id, payload.organisationId);

  return organisationRepository.updateFunction(payload.functionId, payload.name);
};

/**
 * delete a function from an organisation
 * @param {object} payload
 * @param {number} payload.organisationId - The id of the orgonisation
 * @param {string} payload.functionId - The id of the function to delete
 * @param {Message} message {@link module:shared~Message message}
 * @return {external:Promise.<OrganisationFunction>}
 */
const deleteFunction = async (payload, message) => {
  logger.debug('Removing function in organisation', { payload, message });

  await impl.assertThatOrganisationExists(payload.organisationId);
  await impl.assertThatUserIsAdminInOrganisation(message.credentials.id, payload.organisationId);

  return organisationRepository.removeFunction(payload.functionId);
};

/**
 * list functions in an organisation
 * @param {object} payload
 * @param {number} payload.organisationId - The id of the organisation
 * @param {Message} message {@link module:shared~Message message}
 * @return {external:Promise.<OrganisationFunction>}
 */
const listFunctions = async (payload, message) => {
  logger.debug('List all functions for organisation', { payload, message });

  return organisationRepository.findFunctionsInOrganisation(payload.organisationId);
};

async function fetchOrganisationUsers(organisationUsers, message) {
  const userIds = R.map((user) => user.userId, organisationUsers);
  const users = await userService.list({ userIds }, message);
  const findOrganisationUser = (organisationUserId) => R.omit(['function', 'teamIds'],
    R.find(R.propEq('id', organisationUserId), users));

  return R.map((organisationUser) => (
    R.merge(
      findOrganisationUser(organisationUser.userId.toString()),
      R.pick(
        ['externalId', 'roleType', 'invitedAt', 'createdAt', 'updatedAt', 'deletedAt', 'lastActive'],
        organisationUser
      )
    )
  ), organisationUsers);
}

/**
 * Lists all Users in the organisation
 * @param {object} payload
 * @param {Message} message {@link module:shared~Message message}
 * @method listUsers
 * @returns {external:Promise<User[]>}
 */
async function listUsers(payload, message) {
  logger.debug('List all users for organisation', { payload, message });

  await assertUserIsAdminInOrganisation(payload.organisationId, message.credentials.id);

  const options = createOptionsFromPayload(payload);
  let organisationUsers = null;
  if (!payload.select) {
    organisationUsers = await organisationRepository.findUsers(
      R.merge(R.omit(OPTIONS_WHITELIST, payload), { deletedAt: null }), null, options);
  } else {
    organisationUsers = await selectUsers(payload.organisationId, payload.select, options);
  }

  return fetchOrganisationUsers(organisationUsers, message);
}

/**
 * Fetches a user with organisational data.
 * @param {object} payload
 * @param {number} payload.userId - The id of the orgonisation
 * @param {number} payload.organisationId - The id of the organisation
 * @param {Message} message {@link module:shared~Message message}
 * @method getUser
 * @returns {external:Promise.<Boolean>}
 */
async function getUser(payload, message) {
  logger.debug('fetches a user in an organisation', { payload, message });

  // TODO - when the callee is the owner of the user record, it should also be allowed
  const [user, organisationUser, networks] = await Promise.all([
    userRepository.findUser(payload.userId),
    organisationRepository.getPivot(payload.userId, payload.organisationId),
    networkRepository.findNetworksForUser(payload.userId),
  ]);

  return R.merge(R.omit(['teamIds'], user), {
    networkIds: R.pluck('id', networks),
    roleType: organisationUser.roleType,
    functionId: organisationUser.functionId,
    externalId: organisationUser.externalId,
    invitedAt: organisationUser.invitedAt,
    deletedAt: organisationUser.deletedAt,
    updatedAt: organisationUser.updatedAt,
    lastActive: organisationUser.lastActive,
  });
}

/**
 * Updates a user with organisational data.
 * @param {object} payload
 * @param {number} payload.userId - The id of the orgonisation
 * @param {number} payload.organisationId - The id of the organisation
 * @param {number} payload.functionId - The id of the function to be assigned to the user.
 * @param {Message} message {@link module:shared~Message message}
 */
async function updateUser(payload, message) {
  logger.debug('Updates a function for a user in an organisation', { payload, message });

  const userWhiteList = [
    'firstName',
    'lastName',
    'email',
    'password',
    'dateOfBirth',
    'phoneNum',
  ];

  const organisationUserWhiteList = [
    'functionId',
    'roleType',
    'invitedAt',
    'deletedAt',
  ];

  const userFields = R.pick(userWhiteList, payload);
  const organisationUserFields = R.pick(organisationUserWhiteList, payload);

  const updateUserRecord = () => {
    if (R.isEmpty(userFields)) return Promise.resolve();

    return userRepository.updateUser(payload.userId, userFields);
  };

  const updateOrganisationUserRecord = () => {
    if (R.isEmpty(organisationUserFields)) return Promise.resolve();

    return organisationRepository
      .updateUser(
        payload.userId,
        payload.organisationId,
        organisationUserFields
      );
  };

  await updateUserRecord().then(updateOrganisationUserRecord);

  await User.invalidateCache(payload.userId);

  return getUser(payload, message);
}

async function getOrganisation(payload, message) {
  logger.debug('Shows an organisation.', { payload, message });

  return organisationRepository.findById(payload.organisationId);
}

/**
 * Count objects
 * @param {object} payload - Object containing payload data
 * @param {string} payload.organisationId - The id that instantiated the object
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method countUsers
 * @return {external:Promise.<{ total, active, inactive }>}
 */
const countUsers = async (payload, message) => {
  logger.debug('Counting objects', { payload, message });

  return organisationRepository.countUsers(payload.organisationId);
};

const assertNetworksAreInOrganisation = async (organisationId, networkIds) => {
  const organisationNetworks =
    await networkService.fetchOrganisationNetworks(organisationId, networkIds);

  if (organisationNetworks.length !== networkIds.length) {
    throw createError('403');
  }
};

/**
 * Add user to networks
 * @param {object} payload - Object containing payload data
 * @param {string} payload.organisationId - The id of the organisation
 * @param {string} payload.userId - The id of the user
 * @param {string} payload.networks - An array of {networkId, roleType}
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method addUserToNetworks
 */
const addUserToNetworks = async (payload, message) => {
  logger.debug('Add user to networks', { payload, message });

  await assertNetworksAreInOrganisation(payload.organisationId, R.pluck('networkId', payload.networks));

  await Promise.map(payload.networks, (singleNetwork) => networkService.addUserToNetwork({
    networkId: singleNetwork.networkId,
    userId: payload.userId,
    roleType: singleNetwork.roleType || ERoleTypes.EMPLOYEE,
  }));

  await User.invalidateCache(payload.userId);
};

/**
 * Update user in networks
 * @param {object} payload - Object containing payload data
 * @param {string} payload.organisationId - The id of the organisation
 * @param {string} payload.userId - The id of the user
 * @param {string} payload.networks - An array of {networkId, roleType}
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method updateUserInNetworks
 */
const updateUserInNetworks = async (payload, message) => {
  logger.debug('Update user in networks', { payload, message });

  await assertNetworksAreInOrganisation(payload.organisationId, R.pluck('networkId', payload.networks));

  await Promise.map(
    payload.networks,
    (singleNetwork) =>
      networkService.updateUser(singleNetwork.networkId, payload.userId, {
        roleType: singleNetwork.roleType || ERoleTypes.EMPLOYEE,
      })
  );

  await User.invalidateCache(payload.userId);
};

/**
 * Remove user from networks
 * @param {object} payload - Object containing payload data
 * @param {string} payload.organisationId - The id of the organisation
 * @param {string} payload.userId - The id of the user
 * @param {string} payload.networks - An array of networkIds
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method removeUserFromNetworks
 */
const removeUserFromNetworks = async (payload, message) => {
  logger.debug('Remove user from networks', { payload, message });

  await assertNetworksAreInOrganisation(payload.organisationId, payload.networks);

  await Promise.map(
    payload.networks,
    (networkId) => networkService.removeUser(networkId, payload.userId)
  );

  await User.invalidateCache(payload.userId);
};

/**
 * Remove user from organisation
 * @param {object} payload - Object containing payload data
 * @param {string} payload.organisationId - The id of the organisation
 * @param {string} payload.userId - The id of the user
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method removeUserFromNetworks
 */
const removeUserFromOrganisation = async (payload, message) => {
  logger.debug('Remove user from organisation', { payload, message });

  // TODO: use message.credentials.user.hasRoleInOrganisation
  if (!await userHasRoleInOrganisation(payload.organisationId, payload.userId)) {
    throw createError('10031');
  }

  await User.invalidateCache(payload.userId);

  return organisationRepository.removeUser(payload.organisationId, payload.userId);
};

exports.ERoleTypes = ERoleTypes;

exports.assertNetworksAreInOrganisation = assertNetworksAreInOrganisation;
exports.addFunction = addFunction;
exports.addUser = addUser;
exports.addUserToNetworks = addUserToNetworks;
exports.getUser = getUser;
exports.assertUserIsAdminInOrganisation = assertUserIsAdminInOrganisation;
exports.attachNetwork = attachNetwork;
exports.countUsers = countUsers;
exports.create = create;
exports.deleteFunction = deleteFunction;
exports.getOrganisation = getOrganisation;
exports.listForUser = listForUser;
exports.listFunctions = listFunctions;
exports.listNetworks = listNetworks;
exports.listTeamIds = listTeamIds;
exports.listUsers = listUsers;
exports.selectUsers = selectUsers;
exports.removeUserFromNetworks = removeUserFromNetworks;
exports.removeUserFromOrganisation = removeUserFromOrganisation;
exports.updateFunction = updateFunction;
exports.updateUser = updateUser;
exports.updateUserInNetworks = updateUserInNetworks;
exports.userHasRoleInOrganisation = userHasRoleInOrganisation;
