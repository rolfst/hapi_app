const { assert } = require('chai');
const nock = require('nock');
const createError = require('../../../../shared/utils/create-error');
const testHelper = require('../../../../shared/test-utils/helpers');
const stubs = require('./test-utils/stubs');
const client = require('./client');

nock.disableNetConnect();

describe('PMT Client', () => {
  it('should fail with correct error when token is expired', async () => {
    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get('/foo/baz')
      .reply('400', stubs.token_expired_400);

    const response = client.get(`${testHelper.DEFAULT_NETWORK_EXTERNALID}/foo/baz`);

    return assert.isRejected(response, new RegExp(createError('10005').message));
  });
});
