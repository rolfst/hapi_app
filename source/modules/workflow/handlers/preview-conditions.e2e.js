const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const { postRequest } = require('../../../shared/test-utils/request');
const { EConditionOperators } = require('../definitions');
const { ERoleTypes } = require('../../core/definitions');

describe('Workflow handler: preview conditions', () => {
  const conditionFixture = {
    field: 'user.age',
    operator: EConditionOperators.GREATER_THAN_OR_EQUAL,
    value: '0',
  };

  let admin;
  let employee;
  let otherUser;
  let organisation;

  let endpoint;

  before(async () => {
    [admin, employee, otherUser, organisation] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createOrganisation(),
    ]);

    await Promise.all([
      testHelper.addUserToOrganisation(admin.id, organisation.id, ERoleTypes.ADMIN),
      testHelper.addUserToOrganisation(employee.id, organisation.id),
    ]);

    endpoint = `/v2/organisations/${organisation.id}/workflows/preview`;
  });

  after(() => testHelper.cleanAll());

  it('should preview conditions for an admin', async () => {
    const { statusCode, result } = await postRequest(
      endpoint,
      { conditions: [conditionFixture] },
      admin.token
    );

    assert.equal(statusCode, 200);

    const previewData = result.data;

    assert.property(previewData, 'count');
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await postRequest(
      endpoint,
      { conditions: [conditionFixture] },
      employee.token
    );

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await postRequest(
      endpoint,
      { conditions: [conditionFixture] },
      otherUser.token
    );

    assert.equal(statusCode, 403);
  });
});
