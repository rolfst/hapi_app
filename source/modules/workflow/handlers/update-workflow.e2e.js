const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const { putRequest } = require('../../../shared/test-utils/request');
const workflowRepo = require('../repositories/workflow');

describe('Workflow handler: update workflow', () => {
  const workflowFixture = {
    name: 'test workflow update',
  };

  let admin;
  let employee;
  let otherUser;
  let organisation;

  let createdWorkFlow;

  let updateUrl;

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

    updateUrl = `/v2/organisations/${organisation.id}/workflows/${createdWorkFlow.id}`;
  });

  after(() => testHelper.cleanAll());

  it('should update a workflow for an admin', async () => {
    const { statusCode } = await putRequest(
      updateUrl,
      workflowFixture,
      admin.token
    );

    assert.equal(statusCode, 200);

    // Now fetch it again and check the result
    const updatedWorkFlow = await workflowRepo.findOne(createdWorkFlow.id);

    assert.equal(updatedWorkFlow.name, workflowFixture.name);
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await putRequest(
      updateUrl,
      workflowFixture,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await putRequest(
      updateUrl,
      workflowFixture,
      otherUser.token
    );

    assert.equal(statusCode, 403);
  });
});

describe('Workflow handler: update trigger', () => {
  const triggerFixture = {
    type: workflowRepo.ETriggerTypes.DATETIME,
    value: 'changedtothis',
  };

  let admin;
  let employee;
  let otherUser;
  let organisation;

  let workflow;
  let createdTrigger;

  let updateUrl;

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

    // Now create a trigger
    createdTrigger = await testHelper.createTrigger(workflow.id);

    updateUrl = `/v2/organisations/${organisation.id}/workflows/${workflow.id}/triggers/${createdTrigger.id}`;
  });

  after(() => testHelper.cleanAll());

  it('should update a trigger for an admin', async () => {
    const { statusCode } = await putRequest(
      updateUrl,
      triggerFixture,
      admin.token
    );

    assert.equal(statusCode, 200);

    // Now fetch it again and check the result
    const updatedTrigger = await workflowRepo.findOneTrigger(createdTrigger.id);

    assert.equal(updatedTrigger.type, triggerFixture.type);
    assert.equal(updatedTrigger.value, triggerFixture.value);
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await putRequest(
      updateUrl,
      triggerFixture,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await putRequest(
      updateUrl,
      triggerFixture,
      otherUser.token
    );

    assert.equal(statusCode, 403);
  });
});

describe('Workflow handler: update condition', () => {
  const conditionFixture = {
    field: 'changedtothat',
    operator: workflowRepo.EConditionOperators.CONTAINS,
    value: 'changedtothis',
  };

  let admin;
  let employee;
  let otherUser;
  let organisation;

  let workflow;
  let createdCondition;

  let updateUrl;

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

    // Now create a condition
    createdCondition = await testHelper.createCondition(workflow.id);

    updateUrl = `/v2/organisations/${organisation.id}/workflows/${workflow.id}/conditions/${createdCondition.id}`;
  });

  after(() => testHelper.cleanAll());

  it('should update a condition for an admin', async () => {
    const { statusCode } = await putRequest(
      updateUrl,
      conditionFixture,
      admin.token
    );

    assert.equal(statusCode, 200);

    // Now fetch it again and check the result
    const updatedCondition = await workflowRepo.findOneCondition(createdCondition.id);

    assert.equal(updatedCondition.field, conditionFixture.field);
    assert.equal(updatedCondition.operator, conditionFixture.operator);
    assert.equal(updatedCondition.value, conditionFixture.value);
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await putRequest(
      updateUrl,
      conditionFixture,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await putRequest(
      updateUrl,
      conditionFixture,
      otherUser.token
    );

    assert.equal(statusCode, 403);
  });
});

describe('Workflow handler: update action', () => {
  const actionFixture = {
    type: workflowRepo.EActionTypes.MESSAGE,
    meta: { changedContent: 'jup' },
  };

  let admin;
  let employee;
  let otherUser;
  let organisation;

  let workflow;
  let createdAction;

  let updateUrl;

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

    // Now create a action
    createdAction = await testHelper.createAction(workflow.id);

    updateUrl = `/v2/organisations/${organisation.id}/workflows/${workflow.id}/actions/${createdAction.id}`;
  });

  after(() => testHelper.cleanAll());

  it('should update an action for an admin', async () => {
    const { statusCode } = await putRequest(
      updateUrl,
      actionFixture,
      admin.token
    );

    assert.equal(statusCode, 200);

    // Now fetch it again and check the result
    const updatedAction = await workflowRepo.findOneAction(createdAction.id);

    assert.equal(updatedAction.type, actionFixture.type);
    assert.deepEqual(updatedAction.meta, actionFixture.meta);
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await putRequest(
      updateUrl,
      actionFixture,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await putRequest(
      updateUrl,
      actionFixture,
      otherUser.token
    );

    assert.equal(statusCode, 403);
  });
});
