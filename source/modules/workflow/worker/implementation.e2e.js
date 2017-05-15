const R = require('ramda');
const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const workflowService = require('../services/workflow');
const workflowRepository = require('../repositories/workflow');
const { ETriggerTypes, EConditionOperators, EActionTypes } = require('../definitions');
const { ERoleTypes } = require('../../core/definitions');
const workerImplementation = require('./implementation');

describe('Workflow worker: implementation', () => {
  let admin;
  let employee;
  let organisation;

  let network;

  let workflow;

  before(async () => {
    [admin, employee, , organisation] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createOrganisation(),
    ]);

    [network] = await Promise.all([
      testHelper.createNetwork({ organisationId: organisation.id, userId: admin.id }),
      testHelper.addUserToOrganisation(admin.id, organisation.id, 'ADMIN'),
      testHelper.addUserToOrganisation(employee.id, organisation.id),
    ]);

    await testHelper.addUserToNetwork(
      { networkId: network.id, userId: employee.id, roleType: ERoleTypes.EMPLOYEE }
    );

    workflow = await workflowService.createCompleteWorkflow({
      organisationId: organisation.id,
      name: 'worker test',
      triggers: [{
        type: ETriggerTypes.DATETIME,
        value: new Date(2000, 1, 1, 12, 0, 0),
      }],
      conditions: [{
        field: 'network.id',
        operator: EConditionOperators.IN,
        value: `${network.id}`,
      }],
      actions: [{
        type: EActionTypes.MESSAGE,
        meta: {
          text: 'send this',
        },
      }],
    }, { credentials: admin });
  });

  after(() => testHelper.cleanAll());

  it('should select the workflow to be processed', async () => {
    const due = await workerImplementation.fetchDueWorkflowIds();

    const currentWorkflow = R.find(R.equals(workflow.id), due);

    assert.isDefined(currentWorkflow);
  });

  it('should send the message to all network members and mark them as handled', async () => {
    await workerImplementation.fetchAndProcessWorkflows();

    const handledUsers = R.pluck('userId', await workflowRepository.findHandledUsers(workflow.id));

    assert.deepEqual(R.map(String, handledUsers), [admin.id, employee.id]);
  });
});
