const R = require('ramda');
const Promise = require('bluebird');
const createError = require('../../../../shared/utils/create-error');
const workFlowRepo = require('../repositories/workflow');

const logger = require('../../../shared/services/logger')('workflow/service');

/**
 * Create object
 * @param {object} payload - Object containing payload data
 * @param {string} payload.userId - The id that instantiated the object
 * @param {string} payload.networkId - The network the object belongs to
 * @param {string} payload.parentType - The type of parent to get objects for
 * @param {string} payload.parentId - The id of the parent
 * @param {string} payload.objectType - The type of object
 * @param {string} payload.sourceId - The id that refers to the activity
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Object>} {@link module:modules/feed~Object}
 */
const create = async (payload, message) => {
  logger.debug('Creating workflow', { payload, message });

  return workFlowRepo.create(payload);
};
