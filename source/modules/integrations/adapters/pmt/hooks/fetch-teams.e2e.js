const { assert } = require('chai');
const nock = require('nock');
const testHelper = require('../../../../../shared/test-utils/helpers');
const stubs = require('../test-utils/stubs');
const blueprints = require('../test-utils/blueprints');
const hook = require('./fetch-teams');

const ENDPOINT = '/departments';

describe('PMT fetch teams hook', () => {
  nock.disableNetConnect();

  it('should succeed when credentials are correct', async () => {
    const credentials = { username: 'validUsername', password: 'validPassword' };

    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get(ENDPOINT)
      .reply('200', stubs.departments_200);

    const actual = await hook(testHelper.DEFAULT_NETWORK_EXTERNALID)(credentials);
    const expected = blueprints.teams;

    assert.deepEqual(actual, expected);
  });
});
