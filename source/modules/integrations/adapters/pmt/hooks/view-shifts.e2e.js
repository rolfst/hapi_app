import { assert } from 'chai';
import nock from 'nock';
import moment from 'moment';
import createError from '../../../../../shared/utils/create-error';
import * as testHelper from '../../../../../shared/test-utils/helpers';
import * as stubs from '../test-utils/stubs';
import * as blueprints from '../test-utils/blueprints';
import hook from './view-shift';

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
