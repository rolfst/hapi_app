const R = require('ramda');
const { WorkFlow, Trigger, Condition, Action/* , ActionDone */ } = require('./dao');
const createWorkFlowModel = require('../models/workflow');
const createTriggerModel = require('../models/trigger');
const createConditionModel = require('../models/condition');
const createActionModel = require('../models/action');
// const createActionDoneModel = require('../models/actiondone');
const { ETriggerTypes, EConditionOperators, EActionTypes } = require('../h');
const dateUtils = require('../../../shared/utils/date');

const buildWhereConstraint = (idOrWhereConstraint) => (
  typeof idOrWhereConstraint === 'object'
  && !Array.isArray(idOrWhereConstraint)
    ? idOrWhereConstraint
    : {
      id: idOrWhereConstraint instanceof Array ? { $in: idOrWhereConstraint } : idOrWhereConstraint,
    });

const buildQueryOptions = (where) => ({ where });

const completeQueryOptionsPipe = R.pipe(buildWhereConstraint, buildQueryOptions);

const filterByWorkflowId = (id, collection) => R.filter(R.propEq('workflowId', id), collection);
const pluckIds = R.pluck('id');

const create = (attributes) => {
  const whitelist = ['organisationId', 'name', 'meta', 'startDate', 'expirationDate'];

  return WorkFlow
    .create(R.pick(whitelist, attributes))
    .then(createWorkFlowModel);
};

const update = (id, attributes) => {
  const whitelist = ['organisationId', 'name', 'meta', 'startDate', 'expirationDate'];

  return WorkFlow
    .update(R.pick(whitelist, attributes), { where: { id } })
    .then(createWorkFlowModel);
};

const createTrigger = (attributes) => {
  const whitelist = ['workflowId', 'type', 'value'];

  const pickedAttributes = R.pick(whitelist, attributes);

  if (pickedAttributes.value instanceof Date) {
    pickedAttributes.value = dateUtils.toISOString(pickedAttributes.value);
  }

  return Trigger
    .create(pickedAttributes)
    .then(createTriggerModel);
};

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

const createAction = (attributes) => {
  const whitelist = ['workflowId', 'type', 'meta'];

  const pickedAttributes = R.pick(whitelist, attributes);

  if (typeof pickedAttributes.meta === 'object') {
    pickedAttributes.meta = JSON.stringify(pickedAttributes.meta);
  }

  return Action
    .create(pickedAttributes)
    .then(createActionModel);
};

const findAll = (workflowIdsOrWhereConstraints) => {
  return WorkFlow
    .findAll({ where: buildWhereConstraint(workflowIdsOrWhereConstraints) })
    .then(R.map(createWorkFlowModel));
};

const findOne = (workflowIdOrWhereConstraints) => {
  return findAll(buildWhereConstraint(workflowIdOrWhereConstraints))
    .then(R.head);
};

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

const findOneWithData = (workflowIdOrWhereConstraints) => {
  return findAllWithData(buildWhereConstraint(workflowIdOrWhereConstraints))
    .then(R.head);
};

const deleteAll = () => {
  return Promise.all([
    WorkFlow
      .findAll()
      .then(pluckIds)
      .then(completeQueryOptionsPipe)
      .then(WorkFlow.destroy),
    Trigger
      .findAll()
      .then(pluckIds)
      .then(completeQueryOptionsPipe)
      .then(Trigger.destroy),
    Condition
      .findAll()
      .then(pluckIds)
      .then(completeQueryOptionsPipe)
      .then(Condition.destroy),
    Action
      .findAll()
      .then(pluckIds)
      .then(completeQueryOptionsPipe)
      .then(Action.destroy),
    // ActionDone
    //   .findAll()
    //   .then(pluckIds)
    //   .then(completeQueryOptionsPipe)
    //   .then(ActionDone.destroy),
  ]);
};

// Carry along enums for easy access later
exports.ETriggerTypes = ETriggerTypes;
exports.EConditionOperators = EConditionOperators;
exports.EActionTypes = EActionTypes;

exports.create = create;
exports.update = update;
exports.createTrigger = createTrigger;
exports.createCondition = createCondition;
exports.createAction = createAction;
exports.findAll = findAll;
exports.findOne = findOne;
exports.findAllWithData = findAllWithData;
exports.findOneWithData = findOneWithData;
exports.deleteAll = deleteAll;
