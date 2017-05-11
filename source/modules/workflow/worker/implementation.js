const Promise = require('bluebird');
const workflowRepo = require('../repositories/workflow');
const workflowExecutor = require('../services/executor');
const { ETriggerTypes } = require('../definitions');
const logger = require('../../../shared/services/logger')('WORKFLOW/worker/implementation');

const fetchDueWorkflowIds = `
SELECT
  DISTINCT w.id
FROM
  workflows w
  LEFT JOIN workflow_triggers t ON (t.workflow_id = w.id)
WHERE
  w.done = 0
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
      AND CAST(t.value AS DATETIME) >= NOW()
    )
  )
;
`;

const processWorkflowPart = (workflow) => {
  return workflowExecutor
    .fetchUnhandledUsersBatch(workflow)
    .then((userIds) => {
      if (!userIds.length) return;

      return Promise
      // TODO: do action here
        .map(userIds, (userId) => Promise.resolve(userId))
        .then(() => {
          return workflowRepo
            .markUsersHandled(workflow.id, userIds)
            .then(processWorkflowPart(workflow));
        });
    });
};

const processWorkflow = (workflowId) => {
  return workflowRepo
    .findOneWithData(workflowId)
    .then((workflow) => {
      logger.info('Started processing workflow', workflow);

      return workflowRepo
        .update(workflow.id, { lastCheck: new Date() })
        .then(() => {
          return processWorkflowPart(workflow)
            .then(() => {
              return workflowRepo
                .update(workflow.id, { done: true, lastCheck: new Date() });
            });
        });
    })
    .catch((err) => {
      const myErr = err;

      myErr.payload = { workflowId };

      logger.error('Workflow processing failed', myErr);
    });
};

const fetchAndProcessWorkflows = () => {
  // first do a Promise.resolve so we always return a bluebird promise
  return Promise
    .resolve(workflowExecutor.executeQuery(fetchDueWorkflowIds))
    .then((workflowIds) => {
      const processWorkflowP = Promise.map(workflowIds, processWorkflow);

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
