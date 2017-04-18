const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const { deleteRequest } = require('../../../shared/test-utils/request');
const workflowRepo = require('../repositories/workflow');

describe('Workflow handler: remove workflow', () => {
  let admin;
  let employee;
  let otherUser;
  let organisation;

  let createdWorkFlow;

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
    createdWorkFlow = await testHelper.createWorkFlow(organisation.id);

    removeUrl = `/v2/organisations/${organisation.id}/workflows/${createdWorkFlow.id}`;
  });

  after(() => testHelper.cleanAll());

  it('should remove a workflow for an admin', async () => {
    const { statusCode } = await deleteRequest(
      removeUrl,
      admin.token
    );

    assert.equal(statusCode, 200);

    // Now fetch it again and check the result
    const updatedWorkFlow = await workflowRepo.findOne(createdWorkFlow.id);

    assert.isUndefined(updatedWorkFlow);
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await deleteRequest(
      removeUrl,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await deleteRequest(
      removeUrl,
      otherUser.token
    );

    assert.equal(statusCode, 403);
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
    const { statusCode, result } = await deleteRequest(
      removeUrl,
      admin.token
    );

    assert.equal(statusCode, 200);

    // Now fetch it again and check the result
    const updatedTrigger = await workflowRepo.findOneTrigger(createdTrigger.id);

    assert.isUndefined(updatedTrigger);
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await deleteRequest(
      removeUrl,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await deleteRequest(
      removeUrl,
      otherUser.token
    );

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
    const { statusCode, result } = await deleteRequest(
      removeUrl,
      admin.token
    );

    assert.equal(statusCode, 200);

    // Now fetch it again and check the result
    const updatedCondition = await workflowRepo.findOneCondition(createdCondition.id);

    assert.isUndefined(updatedCondition);
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await deleteRequest(
      removeUrl,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await deleteRequest(
      removeUrl,
      otherUser.token
    );

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
    const { statusCode, result } = await deleteRequest(
      removeUrl,
      admin.token
    );

    assert.equal(statusCode, 200);

    // Now fetch it again and check the result
    const updatedAction = await workflowRepo.findOneAction(createdAction.id);

    assert.isUndefined(updatedAction);
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await deleteRequest(
      removeUrl,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await deleteRequest(
      removeUrl,
      otherUser.token
    );

    assert.equal(statusCode, 403);
  });
});
