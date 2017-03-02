import { assert } from 'chai';
import nock from 'nock';
import createError from '../../../../../shared/utils/create-error';
import * as testHelpers from '../../../../../shared/test-utils/helpers';
import * as stubs from '../test-utils/stubs';
import * as blueprints from '../test-utils/blueprints';
import hook from './authenticate';

describe('PMT Authenticate hook', () => {
  nock.disableNetConnect();

  it('should succeed when credentials are correct', async () => {
    const credentials = { username: 'validUsername', password: 'validPassword' };

    nock(testHelpers.DEFAULT_NETWORK_EXTERNALID)
      .post('/login', credentials)
      .reply('200', stubs.api_key_200);

    const actual = await hook(testHelpers.DEFAULT_NETWORK_EXTERNALID)(credentials);
    const expected = blueprints.pmt_credentials;

    assert.deepEqual(actual, expected);
  });

  it('should fail when credentials are incorrect', async () => {
    const credentials = { username: 'invalidUsername', password: 'ValidPassword' };

    nock(testHelpers.DEFAULT_NETWORK_EXTERNALID)
      .post('/login', credentials)
      .reply('401', stubs.incorrect_credentials_401);

    const authenticationHook = hook(testHelpers.DEFAULT_NETWORK_EXTERNALID)(credentials);

    return assert.isRejected(authenticationHook, new RegExp(createError('10004').message));
  });

  it('should fail when username is not provided', async () => {
    const credentials = { password: 'ValidPassword' };

    nock(testHelpers.DEFAULT_NETWORK_EXTERNALID)
      .post('/login', credentials)
      .reply('400', stubs.missing_username_400);

    const authenticationHook = hook(testHelpers.DEFAULT_NETWORK_EXTERNALID)(credentials);

    return assert.isRejected(authenticationHook, new RegExp(createError('422').message));
  });
});
