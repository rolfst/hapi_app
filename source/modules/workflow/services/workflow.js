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
 * @param {number} payload.workflowId - The id of the workflow
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
 * Remove workflow
 * @param {object} payload - Object containing workflow data
 * @param {number} payload.workflowId - The id of the workflow
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method remove
 * @return {external:Promise.<Object>} {@link module:modules/workflow~Object}
 */
const remove = async (payload, message) => {
  logger.debug('Remove workflow', { payload, message });

  const currentWorkflow = await workFlowRepo.findOne(payload.workflowId);

  if (!currentWorkflow) {
    throw new Error('Workflow not found!');
  }

  if (currentWorkflow.organisationId != payload.organisationId) {
    throw new Error('Workflow belongs to a different organisation!');
  }

  return workFlowRepo.destroy(payload.workflowId);
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

/**
 * Create trigger
 * @param {object} payload - Object containing workflow data
 * @param {number} payload.workflowId - The id of the workflow
 * @param {string} payload.type - The type of the trigger
 * @param {string} payload.value - The value of the trigger
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method createTrigger
 * @return {external:Promise.<Object>} {@link module:modules/trigger~Object}
 */
const createTrigger = async (payload, message) => {
  logger.debug('Create trigger', { payload, message });

  const currentWorkflow = await workFlowRepo.findOne(payload.workflowId);

  if (!currentWorkflow) {
    throw new Error('Workflow not found!');
  }

  if (currentWorkflow.organisationId != payload.organisationId) {
    throw new Error('Workflow belongs to a different organisation!');
  }

  return workFlowRepo.createTrigger(payload);
};

/**
 * Update trigger
 * @param {object} payload - Object containing workflow data
 * @param {number} payload.triggerId - The id of the trigger
 * @param {string} payload.type - The type of the trigger
 * @param {string} payload.value - The value of the trigger
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method updateTrigger
 * @return {external:Promise.<Object>} {@link module:modules/trigger~Object}
 */
const updateTrigger = async (payload, message) => {
  logger.debug('Update trigger', { payload, message });

  const currentTrigger = await workFlowRepo.findOneTrigger(payload.triggerId);

  if (!currentTrigger) {
    throw new Error('Trigger not found!');
  }

  const currentWorkflow = await workFlowRepo.findOne(currentTrigger.workflowId);

  if (!currentWorkflow) {
    throw new Error('Workflow not found!');
  }

  if (currentWorkflow.organisationId != payload.organisationId) {
    throw new Error('Workflow belongs to a different organisation!');
  }

  return workFlowRepo.updateTrigger(payload.triggerId, payload);
};

/**
 * Remove trigger
 * @param {object} payload - Object containing workflow data
 * @param {number} payload.triggerId - The id of the trigger
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method removeTrigger
 * @return {external:Promise.<Object>} {@link module:modules/trigger~Object}
 */
const removeTrigger = async (payload, message) => {
  logger.debug('Remove trigger', { payload, message });

  const currentTrigger = await workFlowRepo.findOneTrigger(payload.triggerId);

  if (!currentTrigger) {
    throw new Error('Trigger not found!');
  }

  const currentWorkflow = await workFlowRepo.findOne(currentTrigger.workflowId);

  if (!currentWorkflow) {
    throw new Error('Workflow not found!');
  }

  if (currentWorkflow.organisationId != payload.organisationId) {
    throw new Error('Workflow belongs to a different organisation!');
  }

  return workFlowRepo.destroyTrigger(payload.triggerId);
};

/**
 * Create condition
 * @param {object} payload - Object containing workflow data
 * @param {number} payload.workflowId - The id of the workflow
 * @param {string} payload.field - The field of the condition
 * @param {string} payload.operator - The operator of the condition
 * @param {string} payload.value - The value of the condition
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method createCondition
 * @return {external:Promise.<Object>} {@link module:modules/condition~Object}
 */
const createCondition = async (payload, message) => {
  logger.debug('Create condition', { payload, message });

  const currentWorkflow = await workFlowRepo.findOne(payload.workflowId);

  if (!currentWorkflow) {
    throw new Error('Workflow not found!');
  }

  if (currentWorkflow.organisationId != payload.organisationId) {
    throw new Error('Workflow belongs to a different organisation!');
  }

  return workFlowRepo.createCondition(payload);
};

/**
 * Update condition
 * @param {object} payload - Object containing workflow data
 * @param {number} payload.conditionId - The id of the condition
 * @param {string} payload.type - The type of the condition
 * @param {string} payload.value - The value of the condition
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method updateCondition
 * @return {external:Promise.<Object>} {@link module:modules/condition~Object}
 */
const updateCondition = async (payload, message) => {
  logger.debug('Update condition', { payload, message });

  const currentCondition = await workFlowRepo.findOneCondition(payload.conditionId);

  if (!currentCondition) {
    throw new Error('Condition not found!');
  }

  const currentWorkflow = await workFlowRepo.findOne(currentCondition.workflowId);

  if (!currentWorkflow) {
    throw new Error('Workflow not found!');
  }

  if (currentWorkflow.organisationId != payload.organisationId) {
    throw new Error('Workflow belongs to a different organisation!');
  }

  return workFlowRepo.updateCondition(payload.conditionId, payload);
};

/**
 * Remove condition
 * @param {object} payload - Object containing workflow data
 * @param {number} payload.conditionId - The id of the condition
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method removeCondition
 * @return {external:Promise.<Object>} {@link module:modules/condition~Object}
 */
const removeCondition = async (payload, message) => {
  logger.debug('Remove condition', { payload, message });

  const currentCondition = await workFlowRepo.findOneCondition(payload.conditionId);

  if (!currentCondition) {
    throw new Error('Condition not found!');
  }

  const currentWorkflow = await workFlowRepo.findOne(currentCondition.workflowId);

  if (!currentWorkflow) {
    throw new Error('Workflow not found!');
  }

  if (currentWorkflow.organisationId != payload.organisationId) {
    throw new Error('Workflow belongs to a different organisation!');
  }

  return workFlowRepo.destroyCondition(payload.conditionId);
};

/**
 * Create action
 * @param {object} payload - Object containing workflow data
 * @param {number} payload.workflowId - The id of the workflow
 * @param {string} payload.type - The type of the action
 * @param {string} payload.value - The value of the action
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method createAction
 * @return {external:Promise.<Object>} {@link module:modules/action~Object}
 */
const createAction = async (payload, message) => {
  logger.debug('Create action', { payload, message });

  const currentWorkflow = await workFlowRepo.findOne(payload.workflowId);

  if (!currentWorkflow) {
    throw new Error('Workflow not found!');
  }

  if (currentWorkflow.organisationId != payload.organisationId) {
    throw new Error('Workflow belongs to a different organisation!');
  }

  return workFlowRepo.createAction(payload);
};

/**
 * Update action
 * @param {object} payload - Object containing workflow data
 * @param {number} payload.actionId - The id of the action
 * @param {string} payload.type - The type of the action
 * @param {string} payload.value - The value of the action
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method updateAction
 * @return {external:Promise.<Object>} {@link module:modules/action~Object}
 */
const updateAction = async (payload, message) => {
  logger.debug('Update action', { payload, message });

  const currentAction = await workFlowRepo.findOneAction(payload.actionId);

  if (!currentAction) {
    throw new Error('Action not found!');
  }

  const currentWorkflow = await workFlowRepo.findOne(currentAction.workflowId);

  if (!currentWorkflow) {
    throw new Error('Workflow not found!');
  }

  if (currentWorkflow.organisationId != payload.organisationId) {
    throw new Error('Workflow belongs to a different organisation!');
  }

  return workFlowRepo.updateAction(payload.actionId, payload);
};

/**
 * Remove action
 * @param {object} payload - Object containing workflow data
 * @param {number} payload.actionId - The id of the action
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method removeAction
 * @return {external:Promise.<Object>} {@link module:modules/action~Object}
 */
const removeAction = async (payload, message) => {
  logger.debug('Remove action', { payload, message });

  const currentAction = await workFlowRepo.findOneAction(payload.actionId);

  if (!currentAction) {
    throw new Error('Action not found!');
  }

  const currentWorkflow = await workFlowRepo.findOne(currentAction.workflowId);

  if (!currentWorkflow) {
    throw new Error('Workflow not found!');
  }

  if (currentWorkflow.organisationId != payload.organisationId) {
    throw new Error('Workflow belongs to a different organisation!');
  }

  return workFlowRepo.destroyAction(payload.actionId);
};

// Carry along enums for easy access later
exports.ETriggerTypes = workFlowRepo.ETriggerTypes;
exports.EConditionOperators = workFlowRepo.EConditionOperators;
exports.EActionTypes = workFlowRepo.EActionTypes;

exports.create = create;
exports.update = update;
exports.remove = remove;
exports.fetchOne = fetchOne;
exports.fetchAll = fetchAll;
exports.createTrigger = createTrigger;
exports.updateTrigger = updateTrigger;
exports.removeTrigger = removeTrigger;
exports.createCondition = createCondition;
exports.updateCondition = updateCondition;
exports.removeCondition = removeCondition;
exports.createAction = createAction;
exports.updateAction = updateAction;
exports.removeAction = removeAction;
