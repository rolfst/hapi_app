const R = require('ramda');
const Promise = require('bluebird');
const createError = require('../../../../shared/utils/create-error');
const organisationRepository = require('../../repositories/organisation');
const userRepository = require('../../repositories/user');
const networkRepository = require('../../repositories/network');
const networkService = require('../network');
const userService = require('../user');
const impl = require('./implementation');
const { ERoleTypes } = require('../../definitions');

/**
 * @module modules/core/services/organisation
 */

const logger = require('../../../../shared/services/logger')('CORE/service/object');

const OPTIONS_WHITELIST = ['offset', 'limit'];
const createOptionsFromPayload = R.pick(OPTIONS_WHITELIST);

/**
 * Verifies if a user has a specific role in an organisation
 * @param requestedRole - The role to check for
 * @param organisationId - The id of the organisation
 * @param userId - The id of the user
 * @method userHasRoleInOrganisation
 * @returns {external:Promise.<Boolean>}
 */
const userHasRoleInOrganisation = async (requestedRole, organisationId, userId) => {
  logger.debug('Checking user role in organisation', { requestedRole, organisationId, userId });

  const organisation = await organisationRepository.findById(organisationId);
  if (!organisation) throw createError('404', 'Organisation not found.');

  const userMeta = await organisationRepository.getPivot(userId, organisationId);
  if (!userMeta) throw createError('403');

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
  if (!await userHasRoleInOrganisation(ERoleTypes.ADMIN, organisationId, userId)) {
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

  return organisationRepository.create({ name: payload.name });
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
const attachNetwork = (payload, message) => {
  logger.debug('Attaching network to organisation', { payload, message });

  return networkService.update({
    networkId: payload.networkId,
    organisationId: payload.organisationId,
  }, message);
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

  return networkService.list({ organisationId: payload.organisationId });
};

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
  await impl.assertThatUserIsAdminInOrganisation(payload.userId, payload.organisationId);

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

  await impl.assertThatOrganisationExists(payload.organisationId);
  await impl.assertThatUserIsMemberOfOrganisation(message.credentials.id, payload.organisationId);

  return organisationRepository.findFunctionsInOrganisation(payload.organisationId);
};

async function listUsers(payload, message) {
  logger.debug('List all users for organisation', { payload, message });

  await assertUserIsAdminInOrganisation(payload.organisationId, message.credentials.id);

  const options = createOptionsFromPayload(payload);
  const organisationUsers = await organisationRepository.findUsers(
    R.omit(OPTIONS_WHITELIST, payload), null, options);
  const userIds = R.pick('userId', organisationUsers);
  const users = await userService.list({ userIds });
  const findOrganisationUser = (organisationUserId) => R.find(R.propEq('id', organisationUserId), users);

  return R.map((organisationUser) => {
    return R.merge(findOrganisationUser(organisationUser.userId.toString()),
      R.pick(
        ['externalId', 'roleType', 'invitedAt', 'createdAt', 'deletedAt'],
        organisationUser
      )
    );
  }, organisationUsers);
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
  await assertUserIsAdminInOrganisation(payload.organisationId, message.credentials.id);

  const [user, organisationUser, networks] = await Promise.all([
    userRepository.findUser(payload.userId),
    organisationRepository.getPivot(payload.userId, payload.organisationId),
    networkRepository.findNetworksForUser(payload.userId),
  ]);

  return R.merge(user, {
    networkIds: R.pluck('id', networks),
    roleType: organisationUser.roleType,
    functionId: organisationUser.functionId,
    externalId: organisationUser.externalId,
    invitedAt: organisationUser.invitedAt,
    deletedAt: organisationUser.deletedAt,
    updatedAt: organisationUser.updatedAt,
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

  await assertUserIsAdminInOrganisation(payload.organisationId, message.credentials.id);

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

  return getUser(payload, message);
}

async function getOrganisation(payload, message) {
  logger.debug('Shows an organisation.', { payload, message });

  await impl.assertThatOrganisationExists(payload.organisationId);
  await impl.assertThatUserIsMemberOfOrganisation(message.credentials.id, payload.organisationId);

  return organisationRepository.findById(payload.organisationId);
}

/**
 * Count objects
 * @param {object} payload - Object containing payload data
 * @param {string} payload.organisationId - The id that instantiated the object
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method countUsers
 * @return {external:Promise.<number>}
 */
const countUsers = async (payload, message) => {
  logger.debug('Counting objects', { payload, message });

  const whereConstraint = { organisationId: payload.organisationId };

  return organisationRepository.countUsers(whereConstraint);
};

exports.addFunction = addFunction;
exports.addUser = addUser;
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
exports.listUsers = listUsers;
exports.updateFunction = updateFunction;
exports.updateUser = updateUser;
exports.userHasRoleInOrganisation = userHasRoleInOrganisation;
