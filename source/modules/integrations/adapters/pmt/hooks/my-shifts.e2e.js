const { assert } = require('chai');
const nock = require('nock');
const moment = require('moment');
const createError = require('../../../../../shared/utils/create-error');
const testHelper = require('../../../../../shared/test-utils/helpers');
const stubs = require('../test-utils/stubs');
const blueprints = require('../test-utils/blueprints');
const hook = require('./my-shifts');

describe('PMT my shifts hook', () => {
  nock.disableNetConnect();
  const ENDPOINT = '/me/shifts';
  const TOKEN = 'aefacbadb0123456789';
  const TODAY = moment().format('DD-MM-YYYY');

  it('should succeed when token provided', async () => {
    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get(`${ENDPOINT}/${TODAY}`)
      .reply('200', stubs.shifts_found_200);

    const actual = await hook(testHelper.DEFAULT_NETWORK_EXTERNALID, TOKEN)();
    const expected = blueprints.shifts_found;

    assert.deepEqual(actual, expected);
  });

  // can't force to fail on no token provided
  it('should fail when no user token provided', async () => {
    nock(testHelper.DEFAULT_NETWORK_EXTERNALID).matchHeader('Content-Type', /^/)
      .get(`${ENDPOINT}/${TODAY}`)
      .reply('403', stubs.shifts_forbidden_403);

    const myShiftHook = hook(testHelper.DEFAULT_NETWORK_EXTERNALID)();

    return assert.isRejected(myShiftHook, new RegExp(createError('403').message));
  });

  it('should return empty array on 500 error', async () => {
    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get(`${ENDPOINT}/${TODAY}`)
      .reply('500');

    const actual = await hook(testHelper.DEFAULT_NETWORK_EXTERNALID)();

    assert.deepEqual(actual, []);
  });
});
