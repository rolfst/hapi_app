const R = require('ramda');
const Promise = require('bluebird');
const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const { postRequest } = require('../../../shared/test-utils/request');
const { EConditionOperators } = require('../definitions');
const { ERoleTypes } = require('../../core/definitions');
const queryGenerator = require('../services/query-generator');
const workflowExecutor = require('../services/executor');

const testConditions = (organisationId, conditions) => {
  const info = queryGenerator(organisationId, conditions);
  return workflowExecutor
    .executeQuery(info)
    .then(workflowExecutor.pluckUserIds)
    .then(R.map(R.toString));
};

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

describe('Condition reach', () => {
  let admin;
  let otherUsers;
  let organisation;
  let networkA;
  let networkB;
  let teamA;
  let teamC;
  let networkAUsers;
  let networkBUsers;
  let teamAUsers;
  let teamCUsers;

  let endpoint;

  before(async () => {
    testHelper.cleanAll();
    organisation = await testHelper.createOrganisation();
    [admin] = await Promise.all(
      [testHelper.createUser(), testHelper.createUser()]);


    otherUsers = await Promise.map(R.range(0, 8), () => testHelper.createUser());
    testHelper.addUserToOrganisation(admin.id, organisation.id, ERoleTypes.ADMIN);

    [networkA, networkB] = await Promise.all([
      testHelper.createNetwork({ userId: admin.id, organisationId: organisation.id }),
      testHelper.createNetwork({ userId: admin.id, organisationId: organisation.id }),
    ]);

    [teamA, teamC] = await Promise.all([
      testHelper.createTeamInNetwork(networkA.id),
      testHelper.createTeamInNetwork(networkB.id),
    ]);

    [networkAUsers,
      networkBUsers,
      teamAUsers,
      teamCUsers,
    ] = await Promise.all([
      Promise.map(
        R.slice(0, 4, otherUsers),
        (user) => testHelper.addUserToNetwork({ userId: user.id, networkId: networkA.id })
      ),
      Promise.map(
        R.slice(5, 7, otherUsers),
        (user) => testHelper.addUserToNetwork({ userId: user.id, networkId: networkB.id })
      ),
      Promise.map(
        R.slice(0, 1, otherUsers),
        (user) => testHelper.addUserToTeam(teamA.id, user.id)
      ),
      Promise.map(
        R.slice(5, 6, otherUsers),
        (user) => testHelper.addUserToTeam(teamC.id, user.id)
      ),
    ]);

    endpoint = `/v2/organisations/${organisation.id}/workflows/preview`;
  });

  after(() => testHelper.cleanAll());

  it('should only reach users in the networks specified', async () => {
    const networkIds = [networkA.id, networkB.id];
    const conditionFixture = {
      field: 'network.id',
      operator: EConditionOperators.IN,
      value: networkIds.toString(),
    };

    const { result: { data } } = await postRequest(
      endpoint, { conditions: [conditionFixture] }, admin.token);
    const matchingIds = await testConditions(organisation.id, [conditionFixture]);

    // we have to add the admin to the expected user here
    assert.equal(data.count, (networkAUsers.concat(networkBUsers).length) + 1);
    assert.equal(data.count, matchingIds.length);
  });

  it('should only reach users in the team specified', async () => {
    const teamIds = [teamA.id, teamC.id];
    const conditionFixture = {
      field: 'team.id',
      operator: EConditionOperators.IN,
      value: teamIds.toString(),
    };
    const { result: { data } } = await postRequest(
      endpoint, { conditions: [conditionFixture] }, admin.token);
    const matchingIds = await testConditions(organisation.id, [conditionFixture]);
    const expectedTeamIds = R.map(
      (teamUser) => teamUser.userId, R.uniq(R.concat(teamAUsers, teamCUsers))
    );

    assert.equal(data.count, expectedTeamIds.length);
    assert.equal(data.count, matchingIds.length, '');
    assert.deepEqual(expectedTeamIds, matchingIds);
  });
});
