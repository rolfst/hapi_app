const R = require('ramda');
const { assert } = require('chai');
const sinon = require('sinon');
const testHelper = require('../../../shared/test-utils/helpers');
const workflowService = require('../services/workflow');
const workflowRepository = require('../repositories/workflow');
const workflowExecutor = require('../services/executor');
const { ETriggerTypes, EConditionOperators, EActionTypes } = require('../definitions');
const { ERoleTypes, EParentTypes } = require('../../core/definitions');
const messageService = require('../../feed/services/message');
const { EMessageTypes } = require('../../feed/definitions');
const workerImplementation = require('./implementation');

describe('Workflow worker: implementation', () => {
  let admin;
  let employee;
  let organisation;

  let network;

  let workflow;

  let messageServiceSpy;

  before(async () => {
    [admin, employee, organisation] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createOrganisation(),
    ]);

    [network] = await Promise.all([
      testHelper.createNetwork({ organisationId: organisation.id, userId: admin.id }),
      testHelper.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelper.addUserToOrganisation(employee.id, organisation.id),
    ]);

    await testHelper.addUserToNetwork(
      { networkId: network.id, userId: employee.id, roleType: ERoleTypes.EMPLOYEE }
    );

    workflow = await workflowService.createCompleteWorkflow({
      organisationId: organisation.id,
      name: 'worker test',
      triggers: [{
        type: ETriggerTypes.DATETIME,
        value: new Date(2000, 1, 1, 12, 0, 0),
      }],
      conditions: [{
        field: 'network.id',
        operator: EConditionOperators.IN,
        value: `${network.id}`,
      }],
      actions: [{
        type: EActionTypes.MESSAGE,
        meta: {
          text: 'send this',
        },
      }],
    }, { credentials: admin });

    messageServiceSpy = sinon.spy(messageService, 'create');
  });

  after(() => {
    testHelper.cleanAll();
    messageServiceSpy.restore();
  });

  it('should select the workflow to be processed', async () => {
    const due = await workerImplementation.fetchDueWorkflowIds();

    const currentWorkflow = R.find(R.equals(workflow.id), due);

    assert.isDefined(currentWorkflow);
  });

  it('should send the message to all network members and mark them as handled', async () => {
    await workerImplementation.fetchAndProcessWorkflows();

    const handledUsers = R.pluck('userId', await workflowRepository.findHandledUsers(workflow.id));

    const actualHandledUsers = R.map(String, handledUsers).sort();
    const expectedHandledUsers = [admin.id, employee.id].sort();

    assert.equal(messageServiceSpy.callCount, actualHandledUsers.length);

    const sortedMessageServiceCalls =
      R.sort((arg1, arg2) => arg1[0].userId - arg2[0].userId, messageServiceSpy.args);
    const expectedMessageServiceArgs = R.map((userId) => ([{
      messageType: EMessageTypes.ORGANISATION,
      parentType: EParentTypes.USER,
      parentId: parseInt(userId, 10),
      text: workflow.actions[0].meta.text,
    }, { credentials: { id: parseInt(admin.id, 10) } }]), expectedHandledUsers);

    assert.deepEqual(sortedMessageServiceCalls, expectedMessageServiceArgs);

    assert.deepEqual(actualHandledUsers, expectedHandledUsers);

    const unhandledUsers = await workflowExecutor.fetchUnhandledUsersBatch(workflow);

    assert.lengthOf(unhandledUsers, 0);

    const doneWorkflow = await workflowService.fetchOne({ workflowId: workflow.id });

    assert.isTrue(doneWorkflow.done);
  });
});
