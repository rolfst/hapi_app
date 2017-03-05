import { assert } from 'chai';
import nock from 'nock';
import createError from '../../../../shared/utils/create-error';
import * as testHelper from '../../../../shared/test-utils/helpers';
import * as stubs from './test-utils/stubs';
import client from './client';

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
