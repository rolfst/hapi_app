const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const { putRequest } = require('../../../shared/test-utils/request');

describe.only('Workflow handler: create workflow', () => {
  const workflowFixture = {
    name: 'test workflow update',
  };

  let admin;
  let employee;
  let otherUser;
  let organisation;

  let createdWorkFlow;

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
  });

  after(() => testHelper.cleanAll());

  it('should update a workflow for an admin', async () => {
    const { statusCode, result } = await putRequest(
      `/v2/organisations/${organisation.id}/workflows/${createdWorkFlow.id}`,
      workflowFixture,
      admin.token
    );

    assert.equal(statusCode, 200);

    const updatedWorkFlow = result.data;

    assert.property(updatedWorkFlow, 'id');
    assert.property(updatedWorkFlow, 'organisation_id');
    assert.equal(updatedWorkFlow.name, workflowFixture.name);
    assert.property(updatedWorkFlow, 'meta');
    assert.property(updatedWorkFlow, 'start_date');
    assert.property(updatedWorkFlow, 'expiration_date');
    assert.property(updatedWorkFlow, 'created_at');
    assert.property(updatedWorkFlow, 'updated_at');
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await putRequest(
      `/v2/organisations/${organisation.id}/workflows/${createdWorkFlow.id}`,
      workflowFixture,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await putRequest(
      `/v2/organisations/${organisation.id}/workflows/${createdWorkFlow.id}`,
      workflowFixture,
      otherUser.token
    );

    assert.equal(statusCode, 403);
  });
});
