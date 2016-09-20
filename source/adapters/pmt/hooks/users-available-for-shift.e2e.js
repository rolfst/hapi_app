import { assert } from 'chai';
import nock from 'nock';
import createError from '../../../shared/utils/create-error';
import * as stubs from '../test-utils/stubs';
import * as blueprints from '../test-utils/blueprints';
import hook from './users-available-for-shift';

const TOKEN = 'afcebc0123456789';
const AVAILABLE_SHIFTID = '29383001';

nock.disableNetConnect();

describe('PMT available users hook', () => {
  it('should succeed when credentials are correct', async () => {
    nock(global.networks.pmt.externalId)
      .get(`/shift/${AVAILABLE_SHIFTID}/available`)
      .reply(200, stubs.available_users_200);

    const actual = await hook(global.networks.pmt.externalId, TOKEN)(AVAILABLE_SHIFTID);
    const expected = blueprints.available_users;

    assert.deepEqual(actual, expected);
  });

  it('should fail when no shift id is provided', async () => {
    nock(global.networks.pmt.externalId)
      .get('/shift/undefined/available')
      .reply(404, stubs.available_users_not_found_404);

    const actual = hook(global.networks.pmt.externalId, TOKEN)();

    return assert.isRejected(actual, createError('404'));
  });

  it('should fail when credentials are incorrect', async () => {
    nock(global.networks.pmt.externalId)
      .get(`/shift/${AVAILABLE_SHIFTID}/available`)
      .reply(403, stubs.available_users_forbidden_403);

    const actual = hook(global.networks.pmt.externalId, TOKEN)(AVAILABLE_SHIFTID);

    return assert.isRejected(actual, createError('403'));
  });
});
