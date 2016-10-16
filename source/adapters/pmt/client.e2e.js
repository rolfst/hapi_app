import { assert } from 'chai';
import nock from 'nock';
import createError from '../../shared/utils/create-error';
import * as stubs from './test-utils/stubs';
import client from './client';

nock.disableNetConnect();

describe('PMT Client', () => {
  it('should fail with correct error when token is expired', async () => {
    const BASE_URL = global.networks.pmt.externalId;

    nock(BASE_URL)
      .get('/foo/baz')
      .reply('400', stubs.token_expired_400);

    const response = client.get(`${BASE_URL}/foo/baz`);

    return assert.isRejected(response, new RegExp(createError('10005').message));
  });
});
