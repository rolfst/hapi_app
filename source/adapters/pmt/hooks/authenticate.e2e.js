import { assert } from 'chai';
import nock from 'nock';
import createError from '../../../common/utils/create-error';
import * as stubs from '../test-utils/stubs';
import * as blueprints from '../test-utils/blueprints';
import hook from './authenticate';

nock.disableNetConnect();

describe('PMT Authenticate hook', () => {
  it('should succeed when credentials are correct', async () => {
    const credential = { username: 'validUsername', password: 'validPassword' };

    nock(global.networks.pmt.externalId)
      .post('/login', credential)
      .reply('200', stubs.api_key_200);

    const actual = await hook(global.networks.pmt.externalId)(credential);
    const expected = blueprints.pmt_credentials;

    assert.deepEqual(actual, expected);
  });

  it('should fail when credentials are incorrect', async () => {
    const credential = { username: 'invalidUsername', password: 'ValidPassword' };

    nock(global.networks.pmt.externalId)
      .post('/login', credential)
      .reply('401', stubs.incorrect_credentials_401);

    const actual = hook(global.networks.pmt.externalId)(credential);

    return assert.isRejected(actual, createError('401'));
  });

  it('should fail when username is not provided', async () => {
    const credential = { password: 'ValidPassword' };

    nock(global.networks.pmt.externalId)
      .post('/login', credential)
      .reply('400', stubs.missing_username_400);

    const actual = hook(global.networks.pmt.externalId)(credential);

    return assert.isRejected(actual, createError('422'));
  });
});
