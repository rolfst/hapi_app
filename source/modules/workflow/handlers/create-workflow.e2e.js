const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const { postRequest } = require('../../../shared/test-utils/request');
// const { ETriggerTypes, EConditionOperators, EActionTypes } = require('../h');

describe('Workflow handler: create workflow', () => {
  const workflowFixture = {
    name: 'test workflow',
  };

  let admin;
  let employee;
  let otherUser;
  let organisation;

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
  });

  after(() => testHelper.cleanAll());

  it('should create a workflow for an admin', async () => {
    const { statusCode, result } = await postRequest(
      `/v2/organisations/${organisation.id}/workflows`,
      workflowFixture,
      admin.token
    );

    assert.equal(statusCode, 200);

    const createdWorkFlow = result.data;

    assert.property(createdWorkFlow, 'id');
    assert.property(createdWorkFlow, 'organisation_id');
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
      `/v2/organisations/${organisation.id}/workflows`,
      workflowFixture,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await postRequest(
      `/v2/organisations/${organisation.id}/workflows`,
      workflowFixture,
      otherUser.token
    );

    assert.equal(statusCode, 403);
  });
});
