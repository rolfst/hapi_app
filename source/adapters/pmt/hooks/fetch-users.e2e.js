import { assert } from 'chai';
import nock from 'nock';
import * as stubs from '../test-utils/stubs';
import * as blueprints from '../test-utils/blueprints';
import hook from './fetch-users';

const ENDPOINT = '/users';

nock.disableNetConnect();

describe('PMT fetch users hook', () => {
  it('should succeed ', async () => {
    nock(global.networks.pmt.externalId)
      .get(ENDPOINT)
      .reply('200', stubs.users_200);

    const actual = await hook(global.networks.pmt.externalId)();
    const expected = blueprints.fetched_users;

    assert.deepEqual(actual, expected);
  });
});
