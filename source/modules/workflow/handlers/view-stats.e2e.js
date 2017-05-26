const R = require('ramda');
const { assert } = require('chai');
const Promise = require('bluebird');
const testHelper = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');
const workflowService = require('../services/workflow');
const { ETriggerTypes, EConditionOperators, EActionTypes } = require('../definitions');

describe('Workflow handler: create complete workflow', () => {
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

    endpoint = `/v2/organisations/${organisation.id}/workflows/stats`;
  });

  after(() => testHelper.cleanAll());

  it.only('should retrieve statistics about the workflows', async () => {
    const { statusCode, result } = await getRequest(endpoint, admin.token);

    console.log('--==--', statusCode, result);
  });
});
