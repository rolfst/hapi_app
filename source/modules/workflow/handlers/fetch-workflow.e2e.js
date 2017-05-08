const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');

describe('Workflow handler: create workflow', () => {
  let admin;
  let employee;
  let otherUser;
  let organisation;

  let createdWorkFlow;
  let createdTriggers;
  let createdConditions;
  let createdActions;

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

    // First create a complete workflow
    [createdWorkFlow, createdTriggers, createdConditions, createdActions] =
      await testHelper.createCompleteWorkFlow(organisation.id);
  });

  after(() => testHelper.cleanAll());

  it('should fetch a complete workflow for an admin', async () => {
    const { statusCode, result } = await getRequest(
      `/v2/organisations/${organisation.id}/workflows/${createdWorkFlow.id}`,
      admin.token
    );

    assert.equal(statusCode, 200);

    const actualWorkFlow = result.data;

    assert.property(actualWorkFlow, 'id');
    assert.property(actualWorkFlow, 'organisation_id');
    assert.property(actualWorkFlow, 'name');
    assert.property(actualWorkFlow, 'meta');
    assert.property(actualWorkFlow, 'start_date');
    assert.property(actualWorkFlow, 'expiration_date');
    assert.property(actualWorkFlow, 'created_at');
    assert.property(actualWorkFlow, 'updated_at');
    assert.isArray(actualWorkFlow.triggers);
    assert.lengthOf(actualWorkFlow.triggers, createdTriggers.length);
    assert.isArray(actualWorkFlow.conditions);
    assert.lengthOf(actualWorkFlow.conditions, createdConditions.length);
    assert.isArray(actualWorkFlow.actions);
    assert.lengthOf(actualWorkFlow.actions, createdActions.length);
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await getRequest(
      `/v2/organisations/${organisation.id}/workflows/${createdWorkFlow.id}`,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await getRequest(
      `/v2/organisations/${organisation.id}/workflows/${createdWorkFlow.id}`,
      otherUser.token
    );

    assert.equal(statusCode, 403);
  });
});
