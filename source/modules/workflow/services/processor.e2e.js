// const R = require('ramda');
const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const workflowProcessor = require('./processor');
const { EConditionOperators } = require('../definitions');

describe('Workflow processor', async () => {
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
  });

  it('should generate a query', async () => {
    const query = workflowProcessor.buildQuery(organisation.id, workflow.conditions.concat([{
      field: 'network.id',
      operator: EConditionOperators.IN,
      value: '1,2,3',
    }]));

    assert.isString(query);
  });
});

