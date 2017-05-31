/* eslint no-param-reassign: ["error", { "props": false }] */
const R = require('ramda');
const Promise = require('bluebird');
const workflowRepo = require('../repositories/workflow');
const workflowExecutor = require('../services/executor');
const { ETriggerTypes, EActionTypes } = require('../definitions');
const { EParentTypes, EObjectTypes } = require('../../core/definitions');
const messageService = require('../../feed/services/message');
const { EMessageTypes } = require('../../feed/definitions');
const logger = require('../../../shared/services/logger')('WORKFLOW/worker/implementation');

const renameKeys = R.curry((keysMap, obj) =>
  R.reduce((acc, key) => R.assoc(keysMap[key] || key, obj[key], acc), {}, R.keys(obj))
);

const fetchDueWorkflowIdsQuery = `
SELECT
  DISTINCT w.id
FROM
  workflows w
  LEFT JOIN workflow_triggers t ON (t.workflow_id = w.id)
WHERE
  IFNULL(w.done, 0) = 0
  AND (
       w.start_date IS NULL
  OR w.start_date > NOW()
  )
  AND (
       w.expiration_date IS NULL
  OR w.expiration_date < NOW()
  )
  AND (
       t.type = '${ETriggerTypes.DIRECT}'
    OR (
          t.type = '${ETriggerTypes.DATETIME}'
      AND CAST(t.value AS DATETIME) <= NOW()
    )
  )
;
`;

const fetchDueWorkflowIds = () =>
  Promise.resolve(workflowExecutor
    .executeQuery(fetchDueWorkflowIdsQuery)
    .then(workflowExecutor.pluckIds));

const doAction = (workflow, action, userId = null) => {
  if (action.type === EActionTypes.MESSAGE) {
    // Without a source id we cannot continue
    if (!action.sourceId) throw new Error('No message added to action!');

    const basicPayload = {
      organisationId: workflow.organisationId,
      objectType: EObjectTypes.ORGANISATION_MESSAGE,
      sourceId: action.sourceId,
    };

    const basicMessage = { credentials: { id: workflow.userId } };

    if (userId) {
      return messageService.createObjectForMessage(R.merge(basicPayload, {
        parentType: EParentTypes.USER,
        parentId: userId,
      }), basicMessage);
    }

    // Organisation wide message
    return messageService.createObjectForMessage(R.merge(basicPayload, {
      parentType: EParentTypes.ORGANISATION,
      parentId: workflow.organisationId,
    }), basicMessage);
  }

  return Promise.reject(new Error('Unknown action'));
};

const processWorkflowPart = (workflow) => {
  // TODO - do with new Promise and setTimeout to avoid hitting the callstack limit
  return workflowExecutor
    .fetchUnhandledUsersBatch(workflow)
    .then((userIds) => {
      if (!userIds.length) return;

      return Promise
        .map(userIds, (userId) => Promise
          .map(workflow.actions, (action) =>
            doAction(workflow, action, userId)
              .then(() => workflowRepo.markUserHandled(workflow.id, userId))))
        .then(() => {
          return processWorkflowPart(workflow);
        });
    });
};

const prepareWorkflowData = async (workflow) => {
  await Promise.map(workflow.actions, async (action) => {
    if (action.sourceId) return;

    if (action.type === EActionTypes.MESSAGE) {
      const messageData = R.merge(renameKeys({
        poll_question: 'pollQuestion',
        poll_options: 'pollOptions',
      }, action.meta), {
        organisationId: workflow.organisationId,
        messageType: EMessageTypes.ORGANISATION,
      });

      const createdMessage = await messageService
        .createWithoutObject(messageData, {
          credentials: { id: workflow.userId },
          network: { id: 0 },
        });

      action.sourceId = createdMessage.id;

      if (action.id) {
        await workflowRepo.updateAction(action.id, { sourceId: action.sourceId });
      }
    }
  });

  return workflow;
};

const processWorkflow = (workflow) => {
  logger.info('Started processing workflow', workflow);

  return workflowRepo
    .update(workflow.id, { lastCheck: new Date() })
    .then(() => prepareWorkflowData(workflow))
    .then(() => {
      const finished = async () => {
        const newMeta = workflow.meta || {};
        const { count } = await workflowExecutor
          .previewConditions(workflow.organisationId, workflow.conditions);
        newMeta.reachCount = count;

        const updateData = { done: true, lastCheck: new Date(), meta: newMeta };

        return workflowRepo
          .update(workflow.id, updateData)
          .then(() => logger.info('Processed workflow', workflow));
      };

      if (!workflow.conditions || !workflow.conditions.length) {
        // if any action fails, it will not be completed as done and could
        //   potentially create unlimited messages
        return Promise
          .map(workflow.actions, (action) => doAction(workflow, action))
          .then(finished);
      }

      // TODO - do with new Promise and setTimeout to avoid hitting the callstack limit
      return processWorkflowPart(workflow)
        .then(finished);
    })
    .catch((err) => {
      const myErr = err;

      myErr.payload = { workflow };

      throw myErr;
    });
};

const fetchAndProcessWorkflows = () => {
  return fetchDueWorkflowIds()
    .then((workflowIds) => {
      if (!workflowIds.length) return;

      const processWorkflowP = Promise.map(workflowIds, (workflowId) => workflowRepo
        .findOneWithData(workflowId).then(processWorkflow));

      return Promise
        .any(processWorkflowP)
        .catch((err) => {
          logger.error('Workflow processing failed', err);
        });
    })
    .catch((err) => {
      logger.error('Workflow processor failed', err);
    });
};

exports.fetchAndProcessWorkflows = fetchAndProcessWorkflows;
exports.fetchDueWorkflowIds = fetchDueWorkflowIds;
exports.processWorkflow = processWorkflow;
