const { assert } = require('chai');
const nock = require('nock');
const moment = require('moment');
const createError = require('../../../../../shared/utils/create-error');
const testHelper = require('../../../../../shared/test-utils/helpers');
const stubs = require('../test-utils/stubs');
const blueprints = require('../test-utils/blueprints');
const hook = require('./view-shift');

describe('PMT view shifts hook', () => {
  nock.disableNetConnect();

  const ENDPOINT = '/me/shifts';
  const TOKEN = 'aefacbadb0123456789';
  const TODAY = moment().format('DD-MM-YYYY');

  it('should succeed when token provided', async () => {
    const knownId = '27362216';

    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get(`${ENDPOINT}/${TODAY}`)
      .reply(200, stubs.shifts_found_200);

    const actual = await hook(testHelper.DEFAULT_NETWORK_EXTERNALID, TOKEN)(knownId);
    const expected = blueprints.found_shift;

    assert.deepEqual(actual, expected);
  });

  it('should return undefined when wrong id provided', async () => {
    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get(`${ENDPOINT}/${TODAY}`)
      .reply(200, stubs.shifts_found_200);

    const actual = await hook(testHelper.DEFAULT_NETWORK_EXTERNALID, TOKEN)();
    const expected = undefined;

    assert.deepEqual(actual, expected);
  });

  // can't force to fail on no token provided
  it('should fail when no user token provided', async () => {
    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get(`${ENDPOINT}/${TODAY}`)
      .reply(403, stubs.shifts_forbidden_403);

    const viewShiftHook = hook(testHelper.DEFAULT_NETWORK_EXTERNALID)();

    return assert.isRejected(viewShiftHook, new RegExp(createError('403').message));
  });
});
