// const R = require('ramda');
const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const queryGenerator = require('./query-generator');
const { EConditionOperators } = require('../definitions');

describe('Workflow query generator', async () => {
  let admin;
  let employee;
  let otherUser;
  let organisation;
  let otherOrganisation;

  let workflow;

  before(async () => {
    [admin, employee, otherUser, organisation, otherOrganisation] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createOrganisation(),
      testHelper.createOrganisation(),
    ]);

    [workflow] = await Promise.all([
      testHelper.createCompleteWorkFlow(organisation.id),
      testHelper.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelper.addUserToOrganisation(employee.id, organisation.id),
      testHelper.addUserToOrganisation(otherUser.id, otherOrganisation.id),
    ]);

    const extraCondition = await testHelper.createCondition(workflow.id, 'network.id', EConditionOperators.IN, '1,2,3');

    workflow.conditions.push(extraCondition);
  });

  it('should generate a query', async () => {
    const query = queryGenerator(organisation.id, workflow.conditions);

    assert.isString(query);
  });
});

