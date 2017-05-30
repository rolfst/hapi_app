const R = require('ramda');
const Promise = require('bluebird');
const workFlowExecutor = require('./executor');
const workFlowRepo = require('../repositories/workflow');
const workFlowProcessor = require('../worker/implementation');
const createError = require('../../../shared/utils/create-error');
const dateUtils = require('../../../shared/utils/date');

const logger = require('../../../shared/services/logger')('workflow/service');

const isNullOrEmpty = R.either(R.isEmpty, R.isNil);

const countCommentsQuery = `
SELECT
  w.id,
  COUNT(fc.id) AS commentsCount,
  MAX(COALESCE(fc.created_at, 0)) AS lastCommentActivity
FROM
  workflows w
    LEFT JOIN workflow_actions wa ON (wa.type = 'message' AND wa.workflow_id = w.id)
    LEFT JOIN feed_comments fc ON (fc.message_id = wa.source_id)
WHERE
      w.organisation_id = :organisationId
  AND w.id IN (:workflowIds)
  AND NOT w.id IS NULL
  AND NOT wa.id IS NULL
GROUP BY
  w.id
;
`;

const countLikesQuery = `
SELECT
  w.id,
  COUNT(l.id) AS likesCount,
  MAX(COALESCE(l.created_at, 0)) AS lastLikeActivity
FROM
  workflows w
    LEFT JOIN workflow_actions wa ON (wa.type = 'message' AND wa.workflow_id = w.id)
    LEFT JOIN likes l ON (l.message_id = wa.source_id)
WHERE
      w.organisation_id = :organisationId
  AND w.id IN (:workflowIds)
  AND NOT w.id IS NULL
  AND NOT wa.id IS NULL
GROUP BY
  w.id
;
`;

const countObjectSeen = `
SELECT
  w.id,
  COUNT(os.id) seenCount
FROM
  workflows w
    LEFT JOIN workflow_actions wa ON (wa.type = 'message' AND wa.workflow_id = w.id)
    LEFT JOIN objects o ON (
      o.object_type = 'organisation_message'
      AND o.source_id = wa.source_id
      AND (o.parent_type = 'organisation' OR o.parent_type = 'user')
    )
    LEFT JOIN object_seen os ON (os.object_id = o.id)
WHERE
      w.organisation_id = :organisationId
  AND w.id IN (:workflowIds)
  AND NOT w.id IS NULL
  AND NOT wa.id IS NULL
GROUP BY
  w.id
;
`;

const assertWorkflowBelongsToOrganisation = (workflow, organisationId) => {
  if (!workflow) {
    throw createError('404');
  }

  if (workflow.organisationId !== organisationId) {
    throw createError('403');
  }
};

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

  assertWorkflowBelongsToOrganisation(currentWorkflow, payload.organisationId);

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

  assertWorkflowBelongsToOrganisation(currentWorkflow, payload.organisationId);

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

  assertWorkflowBelongsToOrganisation(currentWorkflow, payload.organisationId);

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

  assertWorkflowBelongsToOrganisation(currentWorkflow, payload.organisationId);

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

  assertWorkflowBelongsToOrganisation(currentWorkflow, payload.organisationId);

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

  assertWorkflowBelongsToOrganisation(currentWorkflow, payload.organisationId);

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

  assertWorkflowBelongsToOrganisation(currentWorkflow, payload.organisationId);

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

  assertWorkflowBelongsToOrganisation(currentWorkflow, payload.organisationId);

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

  assertWorkflowBelongsToOrganisation(currentWorkflow, payload.organisationId);

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

  assertWorkflowBelongsToOrganisation(currentWorkflow, payload.organisationId);

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

  assertWorkflowBelongsToOrganisation(currentWorkflow, payload.organisationId);

  return workFlowRepo.destroyAction(payload.actionId);
};

async function createCompleteWorkflow(payload, message) {
  const {
    organisationId,
    name,
    meta,
    startDate,
    expirationDate,
    triggers,
    conditions,
    actions,
  } = payload;

  const userId = message.credentials.id;

  const workflowData = { organisationId, userId, name, meta, startDate, expirationDate };

  const directTrigger = R.find(
    R.propEq('type', workFlowRepo.ETriggerTypes.DIRECT));

  const buildWorkflowData = R.ifElse(
    R.either(isNullOrEmpty, R.complement(R.pipe(directTrigger, isNullOrEmpty))),
    R.always(R.assoc('done', true, workflowData)),
    R.always(workflowData)
  );

  const data = buildWorkflowData(triggers);
  const createdWorkFlow = await workFlowRepo.create(data);
  const addWorkflowId = R.assoc('workflowId', createdWorkFlow.id);
  const wfTriggers = R.map(addWorkflowId,
    R.ifElse(
      isNullOrEmpty,
      R.always([{ type: workFlowRepo.ETriggerTypes.DIRECT }]),
      R.identity)(triggers));
  const wfConditions = R.map(addWorkflowId, conditions);
  const wfActions = R.map(addWorkflowId, actions);

  return Promise.all([
    Promise.map(wfTriggers, (trigger) =>
      workFlowRepo.createTrigger({
        workflowId: trigger.workflowId,
        type: trigger.type,
        value: trigger.value,
      })
    ),
    wfConditions.length === 0
      ? Promise.resolve([])
      : Promise.map(wfConditions, (condition) =>
          workFlowRepo.createCondition({
            workflowId: createdWorkFlow.id,
            field: condition.field,
            operator: condition.operator,
            value: condition.value,
          })
        ),
    Promise.map(wfActions, (action) =>
      workFlowRepo.createAction({
        workflowId: action.workflowId,
        type: action.type,
        meta: action.meta,
      })
    ),
  ])
  .then(async ([createdTriggers, createdConditions, createdActions]) => {
    const foundDirectTrigger = R.find(
      R.propEq('type', workFlowRepo.ETriggerTypes.DIRECT), createdTriggers);

    // Add reach count now
    const { count } = await workFlowExecutor
      .previewConditions(createdWorkFlow.organisationId, createdConditions);
    const newMeta = createdWorkFlow.meta || {};
    newMeta.reachCount = count;
    await workFlowRepo.update(createdWorkFlow.id, { meta: newMeta });

    const completeWorkflow = R.merge(createdWorkFlow, {
      meta: newMeta,
      triggers: createdTriggers,
      conditions: createdConditions,
      actions: createdActions,
    });

    if (foundDirectTrigger) {
      workFlowProcessor
        .processWorkflow(completeWorkflow)
        .catch((err) => {
          const myErr = err;

          myErr.artifacts = { message, payload };

          logger.error(`Failure creating complete workflow for: ${createdWorkFlow.id}`, myErr);
          workFlowRepo.update({ id: createdWorkFlow.id, done: false });
        });
    }

    return completeWorkflow;
  })
  .catch((error) => {
    logger.error(`Failure creating complete workflow for: ${createdWorkFlow.id}`, { message, payload, error });
    workFlowRepo.destroy(createdWorkFlow.id);
  });
}

/**
 * Workflow stats
 * @param {object} payload - Object containing the params
 * @param {number} payload.organisationId - The id of the organisation
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method workflowStats
 * @return {external:Promise.<Object>} {@link module:modules/action~Object}
 */
const stats = async (payload) => {
  const [workflows, count] = await Promise.all([
    workFlowRepo.findAll(
      { organisationId: payload.organisationId },
      {
        limit: payload.limit,
        offset: payload.offset,
        order: [['created_at', 'DESC']],
      }
    ),
    workFlowRepo.count({ organisationId: payload.organisationId }),
  ]);

  const workflowIds = workFlowExecutor.pluckIds(workflows);

  const [
    workflowCommentCounts,
    workflowLikeCounts,
    workflowSeenCounts,
    workflowActions,
  ] = await Promise.all([
    workFlowExecutor.executeQuery(
      countCommentsQuery,
      { workflowIds, organisationId: payload.organisationId }
    ),
    workFlowExecutor.executeQuery(
      countLikesQuery,
      { workflowIds, organisationId: payload.organisationId }
    ),
    workFlowExecutor.executeQuery(
      countObjectSeen,
      { workflowIds, organisationId: payload.organisationId }
    ),
    workFlowRepo.findAllActions({ $in: workflowIds }),
  ]);

  const findIdInArray = (id, arr) => R.find(R.propEq('id', id), arr);
  const findActions = (workflowId) => R.filter(R.propEq('workflowId', workflowId), workflowActions);

  const addExtraData = (workflow) => {
    const commentsCountRes = findIdInArray(workflow.id, workflowCommentCounts);
    const likesCountRes = findIdInArray(workflow.id, workflowLikeCounts);
    const seenCountRes = findIdInArray(workflow.id, workflowSeenCounts);
    const actions = findActions(workflow.id);

    let reachCount = null;
    if (!reachCount && workflow.meta && workflow.meta.reachCount) {
      reachCount = workflow.meta.reachCount;
    }

    const seenCount = seenCountRes ? seenCountRes.seenCount : 0;
    const likesCount = likesCountRes ? likesCountRes.likesCount : 0;
    const commentsCount = commentsCountRes ? commentsCountRes.commentsCount : 0;
    const lastInteraction = (() => {
      const lastLikeActivity = R.prop('lastLikeActivity', likesCountRes);
      const lastCommentActivity = R.prop('lastCommentActivity', commentsCountRes);

      if (!lastLikeActivity && !lastCommentActivity) {
        return null;
      }

      let retVal;

      if (!lastLikeActivity) retVal = lastCommentActivity;
      if (!lastCommentActivity) retVal = lastLikeActivity;
      if (lastLikeActivity && lastCommentActivity) {
        retVal = lastCommentActivity > lastLikeActivity
          ? lastCommentActivity
          : lastLikeActivity;
      }

      return dateUtils.toISOString(retVal);
    })();

    return R.merge(workflow, {
      reachCount,
      seenCount,
      actions,
      likesCount,
      commentsCount,
      lastInteraction,
    });
  };

  return {
    data: R.map(addExtraData, workflows),
    count,
  };
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
exports.createCompleteWorkflow = createCompleteWorkflow;
exports.stats = stats;
