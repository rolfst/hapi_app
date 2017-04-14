const R = require('ramda');
const Promise = require('bluebird');
const organisationRepository = require('../../repositories/organisation');
const networkService = require('../network');
const impl = require('./implementation');

/**
 * @module modules/core/services/organisation
 */

const logger = require('../../../../shared/services/logger')('CORE/service/object');

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

  await impl.assertThatUserIsMemberOfOrganisation(payload.userId, payload.organisationId);
  await impl.assertThatUserIsAdminInOrganisation(message.credentials.id, payload.organisationId);

  const organisationUser = await organisationRepository.updateUser(
    payload.userId, payload.organisationId, { functionId: payload.functionId });

  return organisationUser;
}

exports.addFunction = addFunction;
exports.addUser = addUser;
exports.attachNetwork = attachNetwork;
exports.create = create;
exports.deleteFunction = deleteFunction;
exports.listForUser = listForUser;
exports.listFunctions = listFunctions;
exports.listNetworks = listNetworks;
exports.updateFunction = updateFunction;
exports.updateUser = updateUser;
