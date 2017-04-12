const Organisation = require('../../../core/repositories/dao/organisation');
const User = require('../../../core/repositories/dao/user');
const WorkFlow = require('./workflow');
const Trigger = require('./trigger');
const Condition = require('./condition');
const Action = require('./action');
const ActionDone = require('./action-done');

WorkFlow.belongsTo(Organisation, {
  foreignKey: 'organisation_id',
});

Trigger.belongsTo(WorkFlow, {
  foreignKey: 'workflow_id',
});

Condition.belongsTo(WorkFlow, {
  foreignKey: 'workflow_id',
});

Action.belongsTo(WorkFlow, {
  foreignKey: 'workflow_id',
});

ActionDone.belongsTo(WorkFlow, {
  foreignKey: 'workflow_id',
});

ActionDone.belongsTo(WorkFlow, {
  foreignKey: 'user_id',
});

exports.WorkFlow = WorkFlow;
exports.Trigger = Trigger;
exports.Condition = Condition;
exports.Action = Action;
exports.ActionDone = ActionDone;
