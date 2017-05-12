const R = require('ramda');
const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const { postRequest } = require('../../../shared/test-utils/request');
const { ETriggerTypes, EConditionOperators, EActionTypes } = require('../definitions');

describe.only('Workflow handler: create complete workflow', () => {
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
    field: 'user.birthdate',
    operator: EConditionOperators.EQUAL,
    value: '2018-01-01',
  }];
  const triggerFixture = [{
    type: ETriggerTypes.DATETIME,
    value: '2018-01-01 13:00:00',
  }];

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

    createUrl = `/v2/organisations/${organisation.id}/workflows/complete`;
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
});
