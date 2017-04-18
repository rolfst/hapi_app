const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const { deleteRequest } = require('../../../shared/test-utils/request');
const workflowRepo = require('../repositories/workflow');

describe.only('Workflow handler: remove workflow', () => {
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

  it('should remove a workflow for an admin', async () => {
    const { statusCode, result } = await deleteRequest(
      `/v2/organisations/${organisation.id}/workflows/${createdWorkFlow.id}`,
      admin.token
    );

    assert.equal(statusCode, 200);

    // Now fetch it again and check the result
    const updatedWorkFlow = await workflowRepo.findOne(createdWorkFlow.id);

    assert.isUndefined(updatedWorkFlow);
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await deleteRequest(
      `/v2/organisations/${organisation.id}/workflows/${createdWorkFlow.id}`,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await deleteRequest(
      `/v2/organisations/${organisation.id}/workflows/${createdWorkFlow.id}`,
      otherUser.token
    );

    assert.equal(statusCode, 403);
  });
});
