const R = require('ramda');
const { WorkFlow, Trigger, Condition, Action, ActionDone } = require('./dao');
const WorkFlow2Model = require('../models/workflow');
const Trigger2Model = require('../models/trigger');
const Condition2Model = require('../models/condition');
const Action2Model = require('../models/action');
const ActionDone2Model = require('../models/actiondone');

const buildWhereConstraint = (idOrWhereConstraint) =>
  typeof idOrWhereConstraint === 'object'
  && !Array.isArray(idOrWhereConstraint)
    ? idOrWhereConstraint
    : { id: idOrWhereConstraint };

const findAll = (workflowIdsOrWhereConstraints) => {
  return WorkFlow
    .findAll({ where: buildWhereConstraint(workflowIdsOrWhereConstraints) })
    .then(R.map(WorkFlow2Model));
};

const findOne = (workflowIdOrWhereConstraints) => {
  return R.head(findAll(buildWhereConstraint(workflowIdOrWhereConstraints)));
};

const findAllWithData = async (workflowIdsOrWhereConstraints) => {
  const workFlows = await WorkFlow
    .findAll({ where: buildWhereConstraint(workflowIdsOrWhereConstraints) })
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

  const addData = (workflow) => R.merge(workflow, {
    triggers: findTriggers(workflow.id),
    conditions: findConditions(workflow.id),
    actions: findActions(workflow.id),
  });

  return R.map(addData, workFlows);
};

const findOneWithData = (workflowIdOrWhereConstraints) => {
  return R.head(findAllWithData(buildWhereConstraint(workflowIdOrWhereConstraints)));
};

exports.findAll = findAll;
exports.findOne = findOne;
exports.findAllWithData = findAllWithData;
exports.findOneWithData = findOneWithData;
