// const R = require('ramda');
// const Promise = require('bluebird');
const workFlowRepo = require('../repositories/workflow');

const logger = require('../../../shared/services/logger')('workflow/service');

/**
 * Create workflow
 * @param {object} payload - Object containing workflow data
 * @param {number} payload.organisationId - The id of the organisation
 * @param {string} payload.name - The name of the workflow
 * @param {string} payload.startDate - Optional: the date when the workflow is valid
 * @param {string} payload.expirationDate - Optional: the date when the workflow is expired
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Object>} {@link module:modules/workflow~Object}
 */
const create = async (payload, message) => {
  logger.debug('Create workflow', { payload, message });

  return workFlowRepo.create(payload);
};

/**
 * Update workflow
 * @param {object} payload - Object containing workflow data
 * @param {number} payload.workflowId - The id of the organisation
 * @param {string} payload.name - The name of the workflow
 * @param {string} payload.startDate - Optional: the date when the workflow is valid
 * @param {string} payload.expirationDate - Optional: the date when the workflow is expired
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method update
 * @return {external:Promise.<Object>} {@link module:modules/workflow~Object}
 */
const update = async (payload, message) => {
  logger.debug('Create workflow', { payload, message });

  const currentWorkflow = await workFlowRepo.findOne(payload.workflowId);

  if (!currentWorkflow) {
    throw new Error('Workflow not found!');
  }

  if (currentWorkflow.organisationId != payload.organisationId) {
    throw new Error('Workflow belongs to a different organisation!');
  }

  return workFlowRepo
    .update(payload.workflowId, payload);
};

/**
 * Fetch workflow complete with all subdata
 * @param {object} payload - Object containing workflow data
 * @param {number} payload.workflowId - The id of the workflow
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method fetchOne
 * @return {external:Promise.<Object>} {@link module:modules/workflow~Object}
 */
const fetchOne = async (payload, message) => {
  logger.debug('Fetch complete workflow', { payload, message });

  return workFlowRepo.findOneWithData(payload.workflowId);
};

/**
 * Fetch all workflows of an organisation without subdata
 * @param {object} payload - Object containing workflow data
 * @param {number} payload.organisationId - The id of the workflow
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method fetchAll
 * @return {external:Promise.<Array<Object>>} {@link module:modules/workflow~Object}
 */
const fetchAll = (payload, message) => {
  logger.debug('Fetch all workflows of organisation', { payload, message });

  return workFlowRepo.findAll({ organisationId: payload.organisationId });
};

// Carry along enums for easy access later
exports.ETriggerTypes = workFlowRepo.ETriggerTypes;
exports.EConditionOperators = workFlowRepo.EConditionOperators;
exports.EActionTypes = workFlowRepo.EActionTypes;

exports.create = create;
exports.update = update;
exports.fetchOne = fetchOne;
exports.fetchAll = fetchAll;
