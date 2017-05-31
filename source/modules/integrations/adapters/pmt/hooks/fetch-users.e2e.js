const { assert } = require('chai');
const nock = require('nock');
const testHelper = require('../../../../../shared/test-utils/helpers');
const stubs = require('../../../../../shared/test-utils/stubs');
const blueprints = require('../test-utils/blueprints');
const hook = require('./fetch-users');

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

  it('should return empty array on 500 error', async () => {
    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get(ENDPOINT)
      .reply('500');

    const actual = await hook(testHelper.DEFAULT_NETWORK_EXTERNALID)();

    assert.deepEqual(actual, []);
  });
});
