const R = require('ramda');
const { WorkFlow, Trigger, Condition, Action, ActionDone } = require('./dao');
const WorkFlow2Model = require('../models/workflow');
const Trigger2Model = require('../models/trigger');
const Condition2Model = require('../models/condition');
const Action2Model = require('../models/action');
const ActionDone2Model = require('../models/actiondone');

const findAll = (workflowIdsOrWhereConstraints) => {
  const whereConstraints =
    typeof workflowIdsOrWhereConstraints === 'object'
    && !Array.isArray(workflowIdsOrWhereConstraints)
      ? workflowIdsOrWhereConstraints
      : { id: workflowIdsOrWhereConstraints };

  return WorkFlow
    .findAll({ where: whereConstraints })
    .then(R.map(WorkFlow2Model));
};

const findOne = (workflowIdOrWhereConstraints) => {
  const whereConstraints = typeof workflowIdOrWhereConstraints === 'object'
    ? workflowIdOrWhereConstraints
    : { id: [workflowIdOrWhereConstraints] };

  return R.head(findAll(whereConstraints));
};

const findAllWithData = async (workflowIdsOrWhereConstraints) => {
  const whereConstraints =
    typeof workflowIdsOrWhereConstraints === 'object'
    && !Array.isArray(workflowIdsOrWhereConstraints)
      ? workflowIdsOrWhereConstraints
      : { id: workflowIdsOrWhereConstraints };

  const workFlows = await WorkFlow
    .findAll({ where: whereConstraints })
    .then(R.map(WorkFlow2Model));

  const dataFindOptions = { where: { workflowId: R.pluck('id', workFlows) } };

  const [triggers, conditions, actions] = await Promise.all([
    Trigger.findAll(dataFindOptions).then(R.map(Trigger2Model)),
    Condition.findAll(dataFindOptions).then(R.map(Condition2Model)),
    Action.findAll(dataFindOptions).then(R.map(Action2Model)),
  ]);

  const findTriggers = (workflowId) => R.filter(R.propEq('workflowId', workflowId), triggers);
  const findConditions = (workflowId) => R.filter(R.propEq('workflowId', workflowId), conditions);
  const findActions = (workflowId) => R.filter(R.propEq('workflowId', workflowId), actions);

  const addData = (workflow) =>
    R.pipe(
      R.assoc('triggers', findTriggers(workflow.id)),
      R.assoc('conditions', findConditions(workflow.id)),
      R.assoc('actions', findActions(workflow.id)),
    );

  return R.map(addData, workFlows);
};

const findOneWithData = (workflowIdOrWhereConstraints) => {
  const whereConstraints =
    typeof workflowIdOrWhereConstraints === 'object'
      ? workflowIdOrWhereConstraints
      : { id: [workflowIdOrWhereConstraints] };

  return R.head(findAllWithData(whereConstraints));
};
exports.findAll = findAll;
exports.findOne = findOne;
exports.findAllWithData = findAllWithData;
exports.findOneWithData = findOneWithData;
