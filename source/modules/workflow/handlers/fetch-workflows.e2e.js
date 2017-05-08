const R = require('ramda');
const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');

describe('Workflow handler: fetch workflows', () => {
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

    // First create 2 workflows
    await Promise.all([
      testHelper.createWorkFlow(organisation.id),
      testHelper.createWorkFlow(organisation.id),
    ]);
  });

  after(() => testHelper.cleanAll());

  it('should fetch an array of workflows for this organisation', async () => {
    const { statusCode, result } = await getRequest(
      `/v2/organisations/${organisation.id}/workflows`,
      admin.token
    );

    assert.equal(statusCode, 200);

    assert.isArray(result.data);

    // Pick the first item to check properties
    const actualWorkFlow = R.head(result.data);

    assert.property(actualWorkFlow, 'id');
    assert.property(actualWorkFlow, 'organisation_id');
    assert.property(actualWorkFlow, 'name');
    assert.property(actualWorkFlow, 'meta');
    assert.property(actualWorkFlow, 'start_date');
    assert.property(actualWorkFlow, 'expiration_date');
    assert.property(actualWorkFlow, 'created_at');
    assert.property(actualWorkFlow, 'updated_at');
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await getRequest(
      `/v2/organisations/${organisation.id}/workflows`,
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await getRequest(
      `/v2/organisations/${organisation.id}/workflows`,
      otherUser.token
    );

    assert.equal(statusCode, 403);
  });
});
