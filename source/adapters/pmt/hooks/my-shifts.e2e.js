import { assert } from 'chai';
import nock from 'nock';
import moment from 'moment';
import createError from '../../../shared/utils/create-error';
import * as stubs from '../test-utils/stubs';
import * as blueprints from '../test-utils/blueprints';
import hook from './my-shifts';

describe('PMT my shifts hook', () => {
  nock.disableNetConnect();
  const ENDPOINT = '/me/shifts';
  const TOKEN = 'aefacbadb0123456789';
  const TODAY = moment().format('DD-MM-YYYY');

  it('should succeed when token provided', async () => {
    nock(global.networks.pmt.externalId)
      .get(`${ENDPOINT}/${TODAY}`)
      .reply('200', stubs.shifts_found_200);

    const actual = await hook(global.networks.pmt.externalId, TOKEN)();
    const expected = blueprints.shifts_found;

    assert.deepEqual(actual, expected);
  });

  // can't force to fail on no token provided
  it('should fail when no user token provided', async () => {
    nock(global.networks.pmt.externalId).matchHeader('Content-Type', /^/)
      .get(`${ENDPOINT}/${TODAY}`)
      .reply('403', stubs.shifts_forbidden_403);

    const myShiftHook = hook(global.networks.pmt.externalId)();

    return assert.isRejected(myShiftHook, new RegExp(createError('403').message));
  });
});
