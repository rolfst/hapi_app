const R = require('ramda');
const Promise = require('bluebird');
const { assert } = require('chai');
const testHelper = require('../../../shared/test-utils/helpers');
const workFlowRepo = require('./workflow');
const { ETriggerTypes, EConditionOperators, EActionTypes } = require('../definitions');

describe('Workflow repository', () => {
  let admin;
  let employee;
  let organisation;

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
  });

  after(() => testHelper.cleanAll());

  it('should contain all necessary properties when fetching', async () => {
    // First create a complete workflow
    const createdWorkFlow = await workFlowRepo.create({
      organisationId: organisation.id,
      name: 'test workflow',
    });

    const [createdTriggers, createdConditions, createdActions] = await Promise.all([
      Promise.all([
        workFlowRepo.createTrigger({
          workflowId: createdWorkFlow.id,
          type: ETriggerTypes.DATETIME,
          value: '2017-01-01',
        }),
      ]),
      Promise.all([
        workFlowRepo.createCondition({
          workflowId: createdWorkFlow.id,
          field: 'user.age',
          operator: EConditionOperators.GREATER_THAN_OR_EQUAL,
          value: '25',
        }),
        workFlowRepo.createCondition({
          workflowId: createdWorkFlow.id,
          field: 'user.gender',
          operator: EConditionOperators.EQUAL,
          value: 'm',
        }),
      ]),
      Promise.all([
        workFlowRepo.createAction({
          workflowId: createdWorkFlow.id,
          type: EActionTypes.MESSAGE,
          meta: {
            senderId: 1,
            content: 'Too old for stocking',
          },
        }),
      ]),
    ]);

    const completeWorkFlow = await workFlowRepo.findOneWithData(createdWorkFlow.id);
    const omitExtraData = R.omit(['triggers', 'conditions', 'actions']);

    assert.deepEqual(omitExtraData(completeWorkFlow), omitExtraData(createdWorkFlow));
    assert.includeDeepMembers(createdTriggers, completeWorkFlow.triggers);
    assert.includeDeepMembers(createdConditions, completeWorkFlow.conditions);
    assert.includeDeepMembers(createdConditions, completeWorkFlow.conditions);
    assert.includeDeepMembers(createdActions, completeWorkFlow.actions);
  });
});
