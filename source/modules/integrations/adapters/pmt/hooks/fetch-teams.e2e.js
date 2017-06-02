const { assert } = require('chai');
const nock = require('nock');
const testHelper = require('../../../../../shared/test-utils/helpers');
const stubs = require('../test-utils/stubs');
const blueprints = require('../test-utils/blueprints');
const hook = require('./fetch-teams');

const ENDPOINT = '/departments';

describe('PMT fetch teams hook', () => {
  nock.disableNetConnect();
  const credentials = { username: 'validUsername', password: 'validPassword' };

  it('should succeed when credentials are correct', async () => {
    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get(ENDPOINT)
      .reply('200', stubs.departments_200);

    const actual = await hook(testHelper.DEFAULT_NETWORK_EXTERNALID)(credentials);
    const expected = blueprints.teams;

    assert.deepEqual(actual, expected);
  });

  it('should return empty array on 500 error', async () => {
    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get(ENDPOINT)
      .reply('500');

    const actual = await hook(testHelper.DEFAULT_NETWORK_EXTERNALID)(credentials);

    assert.deepEqual(actual, []);
  });
});
