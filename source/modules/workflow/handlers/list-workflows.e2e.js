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

    endpoint = `/v2/organisations/${organisation.id}/workflows`;
  });

  after(() => testHelper.cleanAll());

  it('should retrieve statistics about the workflows', async () => {
    const { statusCode, result } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);

    assert.isArray(result.data);
    assert.lengthOf(result.data, 2);

    R.forEach((workflow) => {
      assert.isArray(workflow.actions);
      assert.isAtLeast(workflow.actions.length, 1);
      R.forEach((action) => {
        assert.property(action, 'type');
        assert.property(action, 'meta');
      }, workflow.actions);
      assert.property(workflow, 'reach_count');
      assert.property(workflow, 'seen_count');
      assert.property(workflow, 'likes');
      assert.property(workflow, 'comments');
      assert.property(workflow, 'last_interaction');
    }, result.data);
  });

  it('should allow pagination', async () => {
    const { statusCode: statusCodeA, result: resultA } = await getRequest(`${endpoint}?limit=1`, admin.token);
    const { statusCode: statusCodeB, result: resultB } = await getRequest(`${endpoint}?limit=1&offset=1`, admin.token);

    assert.equal(statusCodeA, 200);
    assert.isArray(resultA.data);
    assert.lengthOf(resultA.data, 1);

    assert.equal(statusCodeB, 200);
    assert.isArray(resultB.data);
    assert.lengthOf(resultB.data, 1);

    assert.notDeepEqual(resultA.data, resultB.data);
  });

  it('should fail for an employee', async () => {
    const { statusCode } = await getRequest(endpoint, employee.token);

    assert.equal(statusCode, 403);
  });

  it('should fail for user not in organisation', async () => {
    const { statusCode } = await getRequest(endpoint, otherUser.token);

    assert.equal(statusCode, 403);
  });
});
