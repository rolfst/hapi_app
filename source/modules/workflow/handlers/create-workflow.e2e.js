const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const { postRequest } = require('../../../shared/test-utils/request');
const { ETriggerTypes, EConditionOperators, EActionTypes } = require('../definitions');

describe('Workflow handler: create workflow', () => {
  const workflowFixture = {
    name: 'test workflow',
  };

  let admin;
  let employee;
  let otherUser;
  let organisation;

  let createUrl;

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

    createUrl = `/v2/organisations/${organisation.id}/workflows`;
  });

  after(() => testHelper.cleanAll());

  it('should create a workflow for an admin', async () => {
    const { statusCode, result } = await postRequest(
      createUrl,
      workflowFixture,
      admin.token
    );

    assert.equal(statusCode, 200);

    const createdWorkFlow = result.data;

    assert.property(createdWorkFlow, 'id');
    assert.equal(createdWorkFlow.organisation_id, organisation.id);
    assert.equal(createdWorkFlow.name, workflowFixture.name);
    assert.property(createdWorkFlow, 'meta');
    assert.property(createdWorkFlow, 'start_date');
    assert.property(createdWorkFlow, 'expiration_date');
    assert.property(createdWorkFlow, 'created_at');
    assert.property(createdWorkFlow, 'updated_at');
    assert.property(createdWorkFlow, 'triggers');
    assert.property(createdWorkFlow, 'conditions');
    assert.property(createdWorkFlow, 'actions');
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await postRequest(
      createUrl,
      workflowFixture,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await postRequest(
      createUrl,
      workflowFixture,
      otherUser.token
    );

    assert.equal(statusCode, 403);
  });
});

describe('Workflow handler: create trigger', async () => {
  const triggerFixture = {
    type: ETriggerTypes.DATETIME,
    value: '2018-01-01 13:00:00',
  };

  let admin;
  let employee;
  let otherUser;
  let organisation;

  let workflow;

  let createUrl;

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

    createUrl = `/v2/organisations/${organisation.id}/workflows/${workflow.id}/triggers`;
  });

  it('should create a trigger for an admin', async () => {
    const { statusCode, result } = await postRequest(
      createUrl,
      triggerFixture,
      admin.token
    );

    assert.equal(statusCode, 200);

    const createdWorkFlow = result.data;

    assert.property(createdWorkFlow, 'id');
    assert.equal(createdWorkFlow.workflow_id, workflow.id);
    assert.equal(createdWorkFlow.type, triggerFixture.type);
    assert.equal(createdWorkFlow.value, triggerFixture.value);
    assert.property(createdWorkFlow, 'created_at');
    assert.property(createdWorkFlow, 'updated_at');
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await postRequest(
      createUrl,
      triggerFixture,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await postRequest(
      createUrl,
      triggerFixture,
      otherUser.token
    );

    assert.equal(statusCode, 403);
  });
});

describe('Workflow handler: create condition', async () => {
  const conditionFixture = {
    field: 'user.birthdate',
    operator: EConditionOperators.EQUAL,
    value: '2018-01-01',
  };

  let admin;
  let employee;
  let otherUser;
  let organisation;

  let workflow;

  let createUrl;

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

    createUrl = `/v2/organisations/${organisation.id}/workflows/${workflow.id}/conditions`;
  });

  it('should create a condition for an admin', async () => {
    const { statusCode, result } = await postRequest(
      createUrl,
      conditionFixture,
      admin.token
    );

    assert.equal(statusCode, 200);

    const createdWorkFlow = result.data;

    assert.property(createdWorkFlow, 'id');
    assert.equal(createdWorkFlow.workflow_id, workflow.id);
    assert.equal(createdWorkFlow.field, conditionFixture.field);
    assert.equal(createdWorkFlow.operator, conditionFixture.operator);
    assert.equal(createdWorkFlow.value, conditionFixture.value);
    assert.property(createdWorkFlow, 'created_at');
    assert.property(createdWorkFlow, 'updated_at');
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await postRequest(
      createUrl,
      conditionFixture,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await postRequest(
      createUrl,
      conditionFixture,
      otherUser.token
    );

    assert.equal(statusCode, 403);
  });
});

describe('Workflow handler: create action', async () => {
  const actionFixture = {
    type: EActionTypes.MESSAGE,
    meta: {
      content: 'something',
    },
  };

  let admin;
  let employee;
  let otherUser;
  let organisation;

  let workflow;

  let createUrl;

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

    createUrl = `/v2/organisations/${organisation.id}/workflows/${workflow.id}/actions`;
  });

  it('should create a action for an admin', async () => {
    const { statusCode, result } = await postRequest(
      createUrl,
      actionFixture,
      admin.token
    );

    assert.equal(statusCode, 200);

    const createdWorkFlow = result.data;

    assert.property(createdWorkFlow, 'id');
    assert.equal(createdWorkFlow.workflow_id, workflow.id);
    assert.equal(createdWorkFlow.type, actionFixture.type);
    assert.deepEqual(createdWorkFlow.meta, actionFixture.meta);
    assert.property(createdWorkFlow, 'created_at');
    assert.property(createdWorkFlow, 'updated_at');
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await postRequest(
      createUrl,
      actionFixture,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await postRequest(
      createUrl,
      actionFixture,
      otherUser.token
    );

    assert.equal(statusCode, 403);
  });
});

