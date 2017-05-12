// const R = require('ramda');
const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const queryGenerator = require('./query-generator');
const { EConditionOperators } = require('../definitions');

describe('Workflow query generator', async () => {
  const conditions = [{
    field: 'team.id',
    operator: EConditionOperators.IN,
    value: '1',
  }, {
    field: 'network.id',
    operator: EConditionOperators.IN,
    value: '1',
  }, {
    field: 'user.age',
    operator: EConditionOperators.GREATER_THAN_OR_EQUAL,
    value: '1',
  }];

  let admin;
  let employee;
  let otherUser;
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

    await Promise.all([
      testHelper.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelper.addUserToOrganisation(employee.id, organisation.id),
      testHelper.addUserToOrganisation(otherUser.id, otherOrganisation.id),
    ]);
  });

  it('should generate a query containing the correct joins', async () => {
    const query = queryGenerator(organisation.id, conditions);

    assert.isString(query);
    assert.include(query, 'organisation_user ou');
    assert.include(query, 'JOIN users u');
    assert.include(query, 'JOIN networks n');
    assert.include(query, 'JOIN network_user nu');
    assert.include(query, 'JOIN teams t');
    assert.include(query, 'JOIN team_user tu');
  });
});
