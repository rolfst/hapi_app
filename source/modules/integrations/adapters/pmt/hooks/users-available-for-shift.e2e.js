import { assert } from 'chai';
import nock from 'nock';
import createError from '../../../../../shared/utils/create-error';
import * as testHelper from '../../../../../shared/test-utils/helpers';
import * as stubs from '../test-utils/stubs';
import * as blueprints from '../test-utils/blueprints';
import hook from './users-available-for-shift';

describe('PMT available users hook', () => {
  nock.disableNetConnect();

  const TOKEN = 'afcebc0123456789';
  const AVAILABLE_SHIFTID = '29383001';

  it('should succeed when credentials are correct', async () => {
    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get(`/shift/${AVAILABLE_SHIFTID}/available`)
      .reply(200, stubs.available_users_200);

    const actual = await hook(testHelper.DEFAULT_NETWORK_EXTERNALID, TOKEN)(AVAILABLE_SHIFTID);
    const expected = blueprints.available_users;

    assert.deepEqual(actual, expected);
  });

  it('should fail when no shift id is provided', async () => {
    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get('/shift/undefined/available')
      .reply(404, stubs.available_users_not_found_404);

    const availableUsersForShiftHook = hook(testHelper.DEFAULT_NETWORK_EXTERNALID, TOKEN)();

    return assert.isRejected(availableUsersForShiftHook, new RegExp(createError('404').message));
  });

  it('should fail when credentials are incorrect', async () => {
    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get(`/shift/${AVAILABLE_SHIFTID}/available`)
      .reply(403, stubs.available_users_forbidden_403);

    const availableUsersForShiftHook = hook(testHelper.DEFAULT_NETWORK_EXTERNALID,
      TOKEN)(AVAILABLE_SHIFTID);

    return assert.isRejected(availableUsersForShiftHook, new RegExp(createError('403').message));
  });
});