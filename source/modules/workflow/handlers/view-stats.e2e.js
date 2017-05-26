const R = require('ramda');
const { assert } = require('chai');
const Promise = require('bluebird');
const testHelper = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');
const workflowService = require('../services/workflow');
const { ETriggerTypes, EConditionOperators, EActionTypes } = require('../definitions');

describe('Workflow handler: view workflow stats', () => {
  const workflowFixtureA = {
    triggers: [{
      type: ETriggerTypes.DIRECT,
    }],
    conditions: [],
    actions: [{
      type: EActionTypes.MESSAGE,
      meta: { text: 'direct A!' },
    }],
  };

  const workflowFixtureB = {
    triggers: [{
      type: ETriggerTypes.DIRECT,
    }],
    conditions: [{
      field: 'user.id',
      operator: EConditionOperators.GREATER_THAN,
      value: '0',
    }],
    actions: [{
      type: EActionTypes.MESSAGE,
      meta: { text: 'direct B!' },
    }],
  };

  let admin;
  let employee;
  let organisation;

  let endpoint;

  before(async () => {
    [admin, employee, organisation] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createOrganisation(),
    ]);

    await Promise.all([
      testHelper.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelper.addUserToOrganisation(employee.id, organisation.id),
    ]);

    // create both workflows then wait 2 seconds to ensure messages are sent
    await Promise.all([
      workflowService.createCompleteWorkflow(
        R.merge(workflowFixtureA, { organisationId: organisation.id }),
        { credentials: admin }
      ),
      workflowService.createCompleteWorkflow(
        R.merge(workflowFixtureB, { organisationId: organisation.id }),
        { credentials: admin }
      ),
    ]).delay(2000);

    endpoint = `/v2/organisations/${organisation.id}/workflows/stats`;
  });

  after(() => testHelper.cleanAll());

  it('should retrieve statistics about the workflows', async () => {
    const { statusCode, result } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);

    assert.isArray(result.data);
    assert.lengthOf(result.data, 2);

    R.forEach((workflow) => {
      assert.isArray(workflow.actions);
      assert.property(workflow, 'reach_count');
      assert.property(workflow, 'seen_count');
    });
  });
});
