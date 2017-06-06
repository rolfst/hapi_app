const { assert } = require('chai');
const nock = require('nock');
const createError = require('../../../../shared/utils/create-error');
const testHelper = require('../../../../shared/test-utils/helpers');
const userService = require('../../../core/services/user');
const stubs = require('./test-utils/stubs');
const client = require('./client');

nock.disableNetConnect();

describe('PMT Client', () => {
  let createdUser;
  let network;
  const USER_TOKEN = 'foo_token';

  before(async () => {
    createdUser = await testHelper.createUser();
    network = await testHelper.createNetwork({
      userId: createdUser.id,
      userToken: USER_TOKEN,
    });
  });

  it('should fail with correct error when token is expired', async () => {
    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get('/foo/baz')
      .reply('400', stubs.token_expired_400);

    const response = client.get(`${testHelper.DEFAULT_NETWORK_EXTERNALID}/foo/baz`);

    return assert.isRejected(response, new RegExp(createError('10005').message));
  });

  it('should set token to null when token is expired', async () => {
    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get('/foo/baz')
      .reply('400', stubs.token_expired_400);

    const userBeforeReset = await userService.getUserWithNetworkScope({
      id: createdUser.id,
      networkId: network.id,
    });

    await client.get(`${testHelper.DEFAULT_NETWORK_EXTERNALID}/foo/baz`, USER_TOKEN)
      .catch(() => {});

    const userAfterReset = await userService.getUserWithNetworkScope({
      id: createdUser.id,
      networkId: network.id,
    });

    assert.isTrue(userBeforeReset.integrationAuth);
    assert.isFalse(userAfterReset.integrationAuth);
  });
});
