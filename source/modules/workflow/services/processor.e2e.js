// const R = require('ramda');
const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const workflowProcessor = require('./processor');

describe.only('Workflow processor', async () => {
  let admin;
  let employee;
  let otherUser;
  let organisation;

  let workflow;

  before(async () => {
    [admin, employee, otherUser, organisation] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createOrganisation(),
    ]);

    [workflow] = await Promise.all([
      testHelper.createCompleteWorkFlow(organisation.id),
      testHelper.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelper.addUserToOrganisation(employee.id, organisation.id),
    ]);
  });

  it('should generate a query', async () => {
    const query = workflowProcessor.buildQuery(organisation.id, workflow.conditions);

    assert.notEmpty(query);
  });
});

