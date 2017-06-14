const Promise = require('bluebird');
const { assert } = require('chai');
const objectRepo = require('../../core/repositories/object');
const { EObjectTypes } = require('../../core/definitions');
const messageRepo = require('../../feed/repositories/message');
const testHelper = require('../../../shared/test-utils/helpers');
const { deleteRequest } = require('../../../shared/test-utils/request');
const workflowService = require('../services/workflow');
const workflowRepo = require('../repositories/workflow');
const { EActionTypes, ETriggerTypes } = require('../definitions');

describe('Workflow handler: remove workflow', () => {
  let admin;
  let employee;
  let otherUser;
  let organisation;

  let createdWorkFlow;
  let createdAction;

  let removeUrl;

  before(async () => {
    [admin, employee, otherUser, organisation] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createOrganisation(),
    ]);

    await Promise.all([
      testHelper.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelper.addUserToOrganisation(employee.id, organisation.id),
    ]);

    // First create a workflow
    createdWorkFlow = await workflowService.createCompleteWorkflow({
      organisationId: organisation.id,
      triggers: [{
        type: ETriggerTypes.DIRECT,
      }],
      conditions: [],
      actions: [{
        type: EActionTypes.MESSAGE,
        meta: {
          text: 'this should be deleted afterwards',
        },
      }],
    }, { credentials: admin });

    // Wait half a second then retrieve the action
    createdAction = await Promise
      .delay(500)
      .then(() => workflowRepo.findOneAction(createdWorkFlow.actions[0].id));

    removeUrl = `/v2/organisations/${organisation.id}/workflows/${createdWorkFlow.id}`;
  });

  after(() => testHelper.cleanAll());

  it('should remove a workflow for an admin', async () => {
    const { statusCode } = await deleteRequest(removeUrl, null, admin.token);

    assert.equal(statusCode, 200);

    // Now fetch it again and check the result
    const updatedWorkFlow = await workflowRepo.findOne(createdWorkFlow.id);

    assert.isNull(updatedWorkFlow);
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await deleteRequest(removeUrl, null, employee.token);

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await deleteRequest(removeUrl, null, otherUser.token);

    assert.equal(statusCode, 403);
  });

  it('should have removed any messages it created', async () => {
    assert.isNotNull(createdAction.sourceId);

    const [foundObjects, foundMessage] = await Promise.all([
      objectRepo.findBy({
        $or: [
          { objectType: EObjectTypes.FEED_MESSAGE, sourceId: createdAction.sourceId },
          { objectType: EObjectTypes.ORGANISATION_MESSAGE, sourceId: createdAction.sourceId },
        ],
      }),
      messageRepo.findById(createdAction.sourceId),
    ]);

    assert.lengthOf(foundObjects, 0);
    assert.isNull(foundMessage);
  });
});

describe('Workflow handler: remove trigger', () => {
  let admin;
  let employee;
  let otherUser;
  let organisation;

  let workflow;
  let createdTrigger;

  let removeUrl;

  before(async () => {
    [admin, employee, otherUser, organisation] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createOrganisation(),
    ]);

    [workflow] = await Promise.all([
      testHelper.createWorkFlow(organisation.id),
      testHelper.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelper.addUserToOrganisation(employee.id, organisation.id),
    ]);

    // First create a trigger
    createdTrigger = await testHelper.createTrigger(workflow.id);

    removeUrl = `/v2/organisations/${organisation.id}/workflows/${workflow.id}/triggers/${createdTrigger.id}`;
  });

  after(() => testHelper.cleanAll());

  it('should remove a workflow for an admin', async () => {
    const { statusCode } = await deleteRequest(removeUrl, null, admin.token);

    assert.equal(statusCode, 200);

    // Now fetch it again and check the result
    const updatedTrigger = await workflowRepo.findOneTrigger(createdTrigger.id);

    assert.isNull(updatedTrigger);
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await deleteRequest(removeUrl, null, employee.token);

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await deleteRequest(removeUrl, null, otherUser.token);

    assert.equal(statusCode, 403);
  });
});

describe('Workflow handler: remove condition', () => {
  let admin;
  let employee;
  let otherUser;
  let organisation;

  let workflow;
  let createdCondition;

  let removeUrl;

  before(async () => {
    [admin, employee, otherUser, organisation] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createOrganisation(),
    ]);

    [workflow] = await Promise.all([
      testHelper.createWorkFlow(organisation.id),
      testHelper.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelper.addUserToOrganisation(employee.id, organisation.id),
    ]);

    // First create a condition
    createdCondition = await testHelper.createCondition(workflow.id);

    removeUrl = `/v2/organisations/${organisation.id}/workflows/${workflow.id}/conditions/${createdCondition.id}`;
  });

  after(() => testHelper.cleanAll());

  it('should remove a workflow for an admin', async () => {
    const { statusCode } = await deleteRequest(removeUrl, null, admin.token);

    assert.equal(statusCode, 200);

    // Now fetch it again and check the result
    const updatedCondition = await workflowRepo.findOneCondition(createdCondition.id);

    assert.isNull(updatedCondition);
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await deleteRequest(removeUrl, null, employee.token);

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await deleteRequest(removeUrl, null, otherUser.token);

    assert.equal(statusCode, 403);
  });
});

describe('Workflow handler: remove action', () => {
  let admin;
  let employee;
  let otherUser;
  let organisation;

  let workflow;
  let createdAction;

  let removeUrl;

  before(async () => {
    [admin, employee, otherUser, organisation] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createOrganisation(),
    ]);

    [workflow] = await Promise.all([
      testHelper.createWorkFlow(organisation.id),
      testHelper.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelper.addUserToOrganisation(employee.id, organisation.id),
    ]);

    // First create a action
    createdAction = await testHelper.createAction(workflow.id);

    removeUrl = `/v2/organisations/${organisation.id}/workflows/${workflow.id}/actions/${createdAction.id}`;
  });

  after(() => testHelper.cleanAll());

  it('should remove a workflow for an admin', async () => {
    const { statusCode } = await deleteRequest(removeUrl, null, admin.token);

    assert.equal(statusCode, 200);

    // Now fetch it again and check the result
    const updatedAction = await workflowRepo.findOneAction(createdAction.id);

    assert.isNull(updatedAction);
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await deleteRequest(removeUrl, null, employee.token);

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await deleteRequest(removeUrl, null, otherUser.token);

    assert.equal(statusCode, 403);
  });
});
