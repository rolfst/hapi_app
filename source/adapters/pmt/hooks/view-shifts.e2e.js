import { assert } from 'chai';
import nock from 'nock';
import moment from 'moment';
import createError from '../../../common/utils/create-error';
import * as stubs from '../test-utils/stubs';
import * as blueprints from '../test-utils/blueprints';
import hook from './view-shift';

nock.disableNetConnect();

describe.only('PMT view shifts hook', () => {
  const ENDPOINT = '/me/shifts';
  const TOKEN = 'aefacbadb0123456789';
  const TODAY = moment().format('DD-MM-YYYY');

  it('should succeed when token provided', async () => {
    const knownId = '27362216';

    nock(global.networks.pmt.externalId)
      .get(`${ENDPOINT}/${TODAY}`)
      .reply(200, stubs.shifts_found_200);

    const actual = await hook(global.networks.pmt.externalId, TOKEN)(knownId);
    const expected = blueprints.found_shift;

    console.log('actual', actual);
    console.log('expected', expected);

    assert.deepEqual(actual, expected);
  });

  it('should return undefined when wrong id provided', async () => {
    nock(global.networks.pmt.externalId)
      .get(`${ENDPOINT}/${TODAY}`)
      .reply(200, stubs.shifts_found_200);

    const actual = await hook(global.networks.pmt.externalId, TOKEN)();
    const expected = undefined;

    assert.deepEqual(actual, expected);
  });

  // can't force to fail on no token provided
  it('should fail when no user token provided', async () => {
    nock(global.networks.pmt.externalId)
      .get(`${ENDPOINT}/${TODAY}`)
      .reply(403, stubs.shifts_forbidden_403);

    const actual = hook(global.networks.pmt.externalId)();

    return assert.isRejected(actual, createError('403'));
  });
});
