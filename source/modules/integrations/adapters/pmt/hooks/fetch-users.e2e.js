import { assert } from 'chai';
import nock from 'nock';
import * as testHelper from '../../../../../shared/test-utils/helpers';
import * as stubs from '../../../../../shared/test-utils/stubs';
import * as blueprints from '../test-utils/blueprints';
import hook from './fetch-users';

const ENDPOINT = '/users';

describe('PMT fetch users hook', () => {
  nock.disableNetConnect();

  it('should succeed ', async () => {
    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get(ENDPOINT)
      .reply('200', stubs.users_200);

    const actual = await hook(testHelper.DEFAULT_NETWORK_EXTERNALID)();
    const expected = blueprints.fetched_users;

    assert.deepEqual(actual, expected);
  });
});
