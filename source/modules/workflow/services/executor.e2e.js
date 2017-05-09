// const R = require('ramda');
const Promise = require('bluebird');
const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const workflowExecutor = require('./executor');
const { EConditionOperators } = require('../definitions');
const { ERoleTypes } = require('../../core/definitions');

describe('Workflow executor', async () => {
  let admin;
  let employee;
  let otherUser;

  let networkA;
  let networkB;

  let organisation;
  let otherOrganisation;

  before(async () => {
    [admin, employee, otherUser, organisation, otherOrganisation] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createOrganisation(),
      testHelper.createOrganisation(),
    ]);

    [networkA, networkB] = await Promise.all([
      testHelper.createNetwork({ organisationId: organisation.id, userId: admin.id }),
      testHelper.createNetwork({ organisationId: organisation.id, userId: admin.id }),
      testHelper.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelper.addUserToOrganisation(employee.id, organisation.id),
      testHelper.addUserToOrganisation(otherUser.id, otherOrganisation.id),
    ]);

    await Promise.all([
      testHelper.addUserToNetwork({
        networkId: networkA.id,
        userId: admin.id,
        roleType: ERoleTypes.ADMIN,
      }),
      testHelper.addUserToNetwork({
        networkId: networkB.id,
        userId: admin.id,
        roleType: ERoleTypes.ADMIN,
      }),
      testHelper.addUserToNetwork({
        networkId: networkA.id,
        userId: employee.id,
        roleType: ERoleTypes.EMPLOYEE,
      }),
    ]);

    const newUserPromises = [];

    // Add 5 more users to this organisation and networkA
    for (let i = 0, n = 5; i < n; i += 1) {
      newUserPromises.push(testHelper.createUser());
    }

    await Promise
      .all(newUserPromises)
      .then((users) => Promise.map(users, (user) => Promise.all([
        testHelper.addUserToOrganisation(user.id, organisation.id),
        testHelper.addUserToNetwork({
          networkId: networkB.id,
          userId: user.id,
          roleType: ERoleTypes.EMPLOYEE,
        }),
      ])));
  });

  it('should fetch a correct count of users that match the conditions', async () => {
    const result = await workflowExecutor.previewConditions(organisation.id, [{
      field: 'network.id',
      operator: EConditionOperators.IN,
      value: `${networkB.id},${networkA.id}`,
    }]);

    assert.equal(result.count, 7);
  });
});

