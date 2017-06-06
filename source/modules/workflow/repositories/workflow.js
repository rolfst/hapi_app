const R = require('ramda');
const { WorkFlow, Trigger, Condition, Action, ActionDone } = require('./dao');
const createWorkFlowModel = require('../models/workflow');
const createTriggerModel = require('../models/trigger');
const createConditionModel = require('../models/condition');
const createActionModel = require('../models/action');
const createActionDoneModel = require('../models/action-done');
const { ETriggerTypes, EConditionOperators, EActionTypes } = require('../definitions');
const dateUtils = require('../../../shared/utils/date');

const buildWhereConstraint = (idOrWhereConstraint) => (
  typeof idOrWhereConstraint === 'object'
  && !Array.isArray(idOrWhereConstraint)
    ? idOrWhereConstraint
    : {
      id: idOrWhereConstraint instanceof Array ? { $in: idOrWhereConstraint } : idOrWhereConstraint,
    });

const completeQueryOptionsPipe = R.pipe(buildWhereConstraint, R.objOf('where'));

const filterByWorkflowId = (id, collection) => R.filter(R.propEq('workflowId', id), collection);
const pluckIds = R.pluck('id');

const headOrNull = (arr) => R.defaultTo(null, R.head(arr));

const validWorkflowAttributes = ['organisationId', 'userId', 'name', 'meta', 'startDate', 'expirationDate', 'lastCheck', 'done'];

const create = (attributes) => {
  const pickedAttributes = R.pick(validWorkflowAttributes, attributes);

  if (typeof pickedAttributes.meta === 'object') {
    pickedAttributes.meta = JSON.stringify(pickedAttributes.meta);
  }

  return WorkFlow
    .create(pickedAttributes)
    .then(createWorkFlowModel);
};

const update = (id, attributes) => {
  const pickedAttributes = R.pick(validWorkflowAttributes, attributes);

  if (typeof pickedAttributes.meta === 'object') {
    pickedAttributes.meta = JSON.stringify(pickedAttributes.meta);
  }

  return WorkFlow
    .update(pickedAttributes, { where: { id } })
    .then(createWorkFlowModel);
};

const destroy = (id) => WorkFlow.destroy({ where: { id } });

const count = async (workflowIdsOrWhereConstraints) => {
  const [totalCount, pendingCount] = await Promise.all([
    WorkFlow.count({ where: buildWhereConstraint(workflowIdsOrWhereConstraints) }),
    WorkFlow.count({ where: R.merge(
      buildWhereConstraint(workflowIdsOrWhereConstraints),
      { done: null }
    ) }),
  ]);

  return {
    totalCount,
    pendingCount,
    processedCount: totalCount - pendingCount,
  };
};

const findAll = (workflowIdsOrWhereConstraints, options) =>
  WorkFlow
    .findAll(R.merge(options, { where: buildWhereConstraint(workflowIdsOrWhereConstraints) }))
    .then(R.map(createWorkFlowModel));

const findOne = (workflowIdOrWhereConstraints) =>
  findAll(buildWhereConstraint(workflowIdOrWhereConstraints))
    .then(headOrNull);

const findAllWithData = async (workflowIdsOrWhereConstraints) => {
  const workFlows = await WorkFlow
    .findAll({ where: buildWhereConstraint(workflowIdsOrWhereConstraints) })
    .then(R.map(createWorkFlowModel));

  const dataFindOptions = { where: { workflowId: R.pluck('id', workFlows) } };

  const [triggers, conditions, actions] = await Promise.all([
    Trigger.findAll(dataFindOptions).then(R.map(createTriggerModel)),
    Condition.findAll(dataFindOptions).then(R.map(createConditionModel)),
    Action.findAll(dataFindOptions).then(R.map(createActionModel)),
  ]);

  const addData = (workflow) => R.merge(workflow, {
    triggers: filterByWorkflowId(workflow.id, triggers),
    conditions: filterByWorkflowId(workflow.id, conditions),
    actions: filterByWorkflowId(workflow.id, actions),
  });

  return R.map(addData, workFlows);
};

const findOneWithData = (workflowIdOrWhereConstraints) =>
  findAllWithData(buildWhereConstraint(workflowIdOrWhereConstraints))
    .then(headOrNull);

const createTrigger = (attributes) => {
  const whitelist = ['workflowId', 'type', 'value'];

  const pickedAttributes = R.pick(whitelist, attributes);

  if (pickedAttributes.value instanceof Date) {
    pickedAttributes.value = dateUtils.toPlainDateTime(pickedAttributes.value);
  }

  return Trigger
    .create(pickedAttributes)
    .then(createTriggerModel);
};

const updateTrigger = (id, attributes) => {
  const whitelist = ['workflowId', 'type', 'value'];

  const pickedAttributes = R.pick(whitelist, attributes);

  if (pickedAttributes.value instanceof Date) {
    pickedAttributes.value = dateUtils.toPlainDateTime(pickedAttributes.value);
  }

  return Trigger
    .update(pickedAttributes, { where: { id } })
    .then(createTriggerModel);
};

const destroyTrigger = (id) => Trigger.destroy({ where: { id } });

const findOneTrigger = (triggerIdOrWhereConstraints) =>
  Trigger
    .findOne({ where: buildWhereConstraint(triggerIdOrWhereConstraints) })
    .then(createTriggerModel);

const createCondition = (attributes) => {
  const whitelist = ['workflowId', 'field', 'operator', 'value'];

  const pickedAttributes = R.pick(whitelist, attributes);

  if (pickedAttributes.value instanceof Date) {
    pickedAttributes.value = dateUtils.toISOString(pickedAttributes.value);
  }

  return Condition
    .create(pickedAttributes)
    .then(createConditionModel);
};

const updateCondition = (id, attributes) => {
  const whitelist = ['workflowId', 'field', 'operator', 'value'];

  const pickedAttributes = R.pick(whitelist, attributes);

  if (pickedAttributes.value instanceof Date) {
    pickedAttributes.value = dateUtils.toISOString(pickedAttributes.value);
  }

  return Condition
    .update(pickedAttributes, { where: { id } })
    .then(createConditionModel);
};

const destroyCondition = (id) => Condition.destroy({ where: { id } });

const findOneCondition = (conditionIdOrWhereConstraints) =>
  Condition
    .findOne({ where: buildWhereConstraint(conditionIdOrWhereConstraints) })
    .then(createConditionModel);

const createAction = (attributes) => {
  const whitelist = ['workflowId', 'type', 'meta', 'sourceId'];

  const pickedAttributes = R.pick(whitelist, attributes);

  if (typeof pickedAttributes.meta === 'object') {
    pickedAttributes.meta = JSON.stringify(pickedAttributes.meta);
  }

  return Action
    .create(pickedAttributes)
    .then(createActionModel);
};

const updateAction = (id, attributes) => {
  const whitelist = ['workflowId', 'type', 'meta', 'sourceId'];

  const pickedAttributes = R.pick(whitelist, attributes);

  if (typeof pickedAttributes.meta === 'object') {
    pickedAttributes.meta = JSON.stringify(pickedAttributes.meta);
  }

  return Action
    .update(pickedAttributes, { where: { id } })
    .then(createActionModel);
};

const destroyAction = (id) => Action.destroy({ where: { id } });

const findOneAction = (actionIdOrWhereConstraints) =>
  Action
    .findOne({ where: buildWhereConstraint(actionIdOrWhereConstraints) })
    .then(createActionModel);

const findAllActions = (workflowId) =>
  Action
    .findAll({ where: { workflowId } })
    .then(R.map(createActionModel));

const deleteAll = () => Promise.all([
  WorkFlow
    .findAll()
    .then(pluckIds)
    .then(completeQueryOptionsPipe)
    .then(WorkFlow.destroy),
]);

const markUserHandled = (workflowId, userId) => ActionDone.create({ workflowId, userId });

const findHandledUsers = (workflowId) =>
  ActionDone
    .findAll({ where: { workflowId } })
    .then(R.map(createActionDoneModel));

// Carry along enums for easy access later
exports.ETriggerTypes = ETriggerTypes;
exports.EConditionOperators = EConditionOperators;
exports.EActionTypes = EActionTypes;

exports.create = create;
exports.update = update;
exports.destroy = destroy;
exports.count = count;
exports.findAll = findAll;
exports.findOne = findOne;
exports.findAllWithData = findAllWithData;
exports.findOneWithData = findOneWithData;
exports.createTrigger = createTrigger;
exports.updateTrigger = updateTrigger;
exports.destroyTrigger = destroyTrigger;
exports.findOneTrigger = findOneTrigger;
exports.createCondition = createCondition;
exports.createCondition = createCondition;
exports.updateCondition = updateCondition;
exports.destroyCondition = destroyCondition;
exports.findOneCondition = findOneCondition;
exports.createAction = createAction;
exports.createAction = createAction;
exports.updateAction = updateAction;
exports.destroyAction = destroyAction;
exports.findOneAction = findOneAction;
exports.findAllActions = findAllActions;
exports.deleteAll = deleteAll;
exports.findHandledUsers = findHandledUsers;
exports.markUserHandled = markUserHandled;
