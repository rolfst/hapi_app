const R = require('ramda');
const { assert } = require('chai');
const sinon = require('sinon');
const testHelper = require('../../../shared/test-utils/helpers');
const workflowService = require('../services/workflow');
const workflowRepository = require('../repositories/workflow');
const workflowExecutor = require('../services/executor');
const { ETriggerTypes, EConditionOperators, EActionTypes } = require('../definitions');
const { EParentTypes, EObjectTypes } = require('../../core/definitions');
const { ERoleTypes } = require('../../authorization/definitions');
const messageService = require('../../feed/services/message');
const { EMessageTypes } = require('../../feed/definitions');
const workerImplementation = require('./implementation');

describe('Workflow worker: implementation', () => {
  let admin;
  let employee;
  let organisation;

  let network;

  let workflow;

  let createMessageSpy;
  let createObjectSpy;

  beforeEach(async () => {
    await testHelper.cleanAll();

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

    createMessageSpy = sinon.spy(messageService, 'createWithoutObject');
    createObjectSpy = sinon.spy(messageService, 'createObjectForMessage');
  });

  afterEach(() => {
    createMessageSpy.restore();
    createObjectSpy.restore();

    return testHelper.cleanAll();
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

    assert(createMessageSpy.called);

    assert(createMessageSpy.calledWith(R.merge(workflow.actions[0].meta, {
      organisationId: parseInt(organisation.id, 10),
      messageType: EMessageTypes.ORGANISATION,
    }), { credentials: { id: parseInt(admin.id, 10) } }));

    const createdMessageId = (await createMessageSpy.returnValues[0]).id;

    assert.equal(createObjectSpy.callCount, actualHandledUsers.length);
    R.forEach((userId) => {
      assert(createObjectSpy.calledWith({
        organisationId: parseInt(organisation.id, 10),
        objectType: EObjectTypes.ORGANISATION_MESSAGE,
        sourceId: createdMessageId,
        parentType: EParentTypes.USER,
        parentId: parseInt(userId, 10),
      }, { credentials: { id: parseInt(admin.id, 10) } }));
    }, actualHandledUsers);

    assert.deepEqual(actualHandledUsers, expectedHandledUsers);

    const unhandledUsers = await workflowExecutor.fetchUnhandledUsersBatch(workflow);

    assert.lengthOf(unhandledUsers, 0);

    const doneWorkflow = await workflowService.fetchOne({ workflowId: workflow.id });

    assert.isTrue(doneWorkflow.done);
  });

  it('should make one object when there are no conditions', async () => {
    await workflowService.removeCondition({
      organisationId: parseInt(organisation.id, 10),
      conditionId: workflow.conditions[0].id,
    }, { credentials: admin });

    await workerImplementation.fetchAndProcessWorkflows();

    assert.equal(createMessageSpy.called, 1);
    assert.equal(createObjectSpy.called, 1);

    assert(createMessageSpy.calledWith(R.merge(workflow.actions[0].meta, {
      organisationId: parseInt(organisation.id, 10),
      messageType: EMessageTypes.ORGANISATION,
    }), { credentials: { id: parseInt(admin.id, 10) } }));

    const createdMessageId = (await createMessageSpy.returnValues[0]).id;

    assert(createObjectSpy.calledWith({
      organisationId: parseInt(organisation.id, 10),
      objectType: EObjectTypes.ORGANISATION_MESSAGE,
      sourceId: createdMessageId,
      parentType: EParentTypes.ORGANISATION,
      parentId: parseInt(organisation.id, 10),
    }, { credentials: { id: parseInt(admin.id, 10) } }));
  });
});
