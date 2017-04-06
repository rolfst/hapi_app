const createError = require('../../../../shared/utils/create-error');
const organisationRepository = require('../../repositories/organisation');
const networkService = require('../network');

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
 * @return {external:Promise<Organisation>} {@link module:core~Organisation}
 */
const create = (payload, message) => {
  logger.debug('Creating organisation', { payload, message });

  return organisationRepository.create({ name: payload.name });
};

/**
 * Listing networks that belong to the organisation
 * @param {object} payload
 * @param {string} payload.organisationId
 * @param {Message} message {@link module:shared~Message message}
 * @method listNetworks
 * @return {external:Promise<Network[]>} {@link module:core~Network}
 */
const listNetworks = async (payload, message) => {
  logger.debug('List all network for organisation', { payload, message });

  const organisation = await organisationRepository.findById(payload.organisationId);
  if (!organisation) throw createError('404', 'Organisation not found.');
  if (!await organisationRepository.hasUser(message.credentials.id, organisation.id)) {
    throw createError('403');
  }

  const networks = await networkService.list({ organisationId: organisation.id });

  return networks;
};

/**
 * Adding an user to organisation
 * @param {object} payload
 * @param {string} payload.organisationId
 * @param {string} payload.userId
 * @param {UserRoles} payload.roleType
 * @param {Message} message {@link module:shared~Message message}
 * @method addUser
 * @return {external:Promise<boolean>}
 */
const addUser = async (payload, message) => {
  logger.debug('Adding user to organisation', { payload, message });

  const organisation = await organisationRepository.findById(payload.organisationId);
  if (!organisation) throw createError('404', 'Organisation not found.');

  const userMeta = await organisationRepository.getPivot(payload.userId, payload.organisationId);
  if (!userMeta || userMeta.roleType !== 'ADMIN') throw createError('403');

  return organisationRepository.addUser(payload.userId, payload.organisationId, payload.roleType);
};

exports.create = create;
exports.listNetworks = listNetworks;
exports.addUser = addUser;
