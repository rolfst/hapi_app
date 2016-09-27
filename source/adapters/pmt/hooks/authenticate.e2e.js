import { assert } from 'chai';
import nock from 'nock';
import createError from '../../../shared/utils/create-error';
import * as stubs from '../test-utils/stubs';
import * as blueprints from '../test-utils/blueprints';
import hook from './authenticate';

nock.disableNetConnect();

describe('PMT Authenticate hook', () => {
  it('should succeed when credentials are correct', async () => {
    const credentials = { username: 'validUsername', password: 'validPassword' };

    nock(global.networks.pmt.externalId)
      .post('/login', credentials)
      .reply('200', stubs.api_key_200);

    const actual = await hook(global.networks.pmt.externalId)(credentials);
    const expected = blueprints.pmt_credentials;

    assert.deepEqual(actual, expected);
  });

  it('should fail when credentials are incorrect', async () => {
    const credentials = { username: 'invalidUsername', password: 'ValidPassword' };

    nock(global.networks.pmt.externalId)
      .post('/login', credentials)
      .reply('401', stubs.incorrect_credentials_401);

    try {
      await hook(global.networks.pmt.externalId)(credentials);

      assert.fail();
    } catch (err) {
      assert.deepEqual(err, createError('10004'));
    }
  });

  it('should fail when username is not provided', async () => {
    const credentials = { password: 'ValidPassword' };

    nock(global.networks.pmt.externalId)
      .post('/login', credentials)
      .reply('400', stubs.missing_username_400);

    try {
      await hook(global.networks.pmt.externalId)(credentials);

      assert.fail();
    } catch (err) {
      assert.deepEqual(err, createError('422'));
    }
  });
});
