const R = require('ramda');
const { assert } = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const testHelper = require('../../../shared/test-utils/helpers');
const { postRequest } = require('../../../shared/test-utils/request');
const workFlowProcessor = require('../worker/implementation');
const { ETriggerTypes, EConditionOperators, EActionTypes } = require('../definitions');

describe('Workflow handler: create complete workflow', () => {
  const workflowFixture = {
    name: 'test workflow',
  };
  const actionFixture = [{
    type: EActionTypes.MESSAGE,
    meta: {
      content: 'something',
    },
  }];
  const conditionFixture = [{
    field: 'user.date_of_birth',
    operator: EConditionOperators.EQUAL,
    value: '2018-01-01',
  }];
  const triggerFixture = [{
    type: ETriggerTypes.DATETIME,
    value: '2018-01-01 13:00:00',
  }];

  const directMessageWorkflowFixture = {
    triggers: [{
      type: ETriggerTypes.DIRECT,
    }],
    conditions: [{ field: 'user.age', operator: EConditionOperators.EQUAL, value: '18' }],
    actions: [{
      type: EActionTypes.MESSAGE,
      meta: { text: 'direct!' },
    }],
  };

  let admin;
  let employee;
  let otherUser;
  let organisation;

  let createUrl;

  let processWorkflowSpy;

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

    processWorkflowSpy = sinon.spy(workFlowProcessor, 'processWorkflow');

    createUrl = `/v2/organisations/${organisation.id}/workflows`;
  });

  after(() => testHelper.cleanAll());

  it('should create a workflow for an admin', async () => {
    const payload = R.mergeAll([
      workflowFixture,
      { triggers: triggerFixture },
      { actions: actionFixture },
      { conditions: conditionFixture },
    ]);
    const { statusCode, result } = await postRequest(
      createUrl,
      payload,
      admin.token
    );

    assert.equal(statusCode, 200);

    const createdWorkFlow = result.data;
    assert.property(createdWorkFlow, 'id');
    assert.equal(createdWorkFlow.organisation_id, organisation.id);
    assert.equal(createdWorkFlow.user_id, admin.id);
    assert.equal(createdWorkFlow.name, workflowFixture.name);
    assert.property(createdWorkFlow, 'meta');
    assert.property(createdWorkFlow, 'start_date');
    assert.property(createdWorkFlow, 'expiration_date');
    assert.property(createdWorkFlow, 'created_at');
    assert.property(createdWorkFlow, 'updated_at');
    assert.isArray(createdWorkFlow.triggers);
    assert.isArray(createdWorkFlow.conditions);
    assert.isArray(createdWorkFlow.actions);
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

  it('should process workflow immediately when trigger type is direct', async () => {
    const { statusCode } = await postRequest(
      createUrl,
      directMessageWorkflowFixture,
      admin.token
    );

    assert.equal(statusCode, 200);
    assert(processWorkflowSpy.called);
    assert.isObject(processWorkflowSpy.args[0][0]);
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
    assert.equal(createdWorkFlow.value, moment(triggerFixture.value).toISOString());
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
