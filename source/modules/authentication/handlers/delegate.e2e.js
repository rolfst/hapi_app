import { assert } from 'chai';
import tokenUtil from '../../../shared/utils/token';
import createRefreshToken from '../utils/create-refresh-token';
import * as userRepo from '../../core/repositories/user';
import { getRequest, postRequest } from '../../../shared/test-utils/request';

describe('Delegate', () => {
  let createdUser;
  let refreshToken;
  const DELEGATE_URL = '/v2/delegate';

  before(async () => {
    const attributes = {
      firstName: 'Delegate',
      lastName: 'Doe',
      email: 'delegate@user.com',
      password: 'foo',
      username: 'Delegate Doe',
    };

    createdUser = await userRepo.createUser(attributes);
    await global.networks.pmt.addUser(createdUser);

    // Authenticate created user to retrieve a refresh token
    const credentials = { username: createdUser.username, password: 'foo' };
    const response = await postRequest('/v2/authenticate', credentials);

    refreshToken = response.result.data.refresh_token;
  });

  after(() => createdUser.destroy());

  it('refresh token should contain correct', async () => {
    const endpoint = `${DELEGATE_URL}?refresh_token=${refreshToken}`;
    const { result, statusCode } = await getRequest(endpoint);
    const decodedToken = tokenUtil.decode(result.data.access_token);

    assert.equal(statusCode, 200);
    assert.equal(decodedToken.type, 'access_token');
    assert.equal(decodedToken.sub, createdUser.id);
    assert.property(decodedToken, 'integrations');
  });

  it('should return a new access token', async () => {
    const { result } = await getRequest(`${DELEGATE_URL}?refresh_token=${refreshToken}`);

    assert.equal(result.success, true);
    assert.property(result.data, 'access_token');
    assert.isDefined(result.data.access_token);
  });

  it('should fail when no refresh token provided', async () => {
    const { statusCode } = await getRequest(DELEGATE_URL);

    assert.equal(statusCode, 422);
  });

  it('should fail when user is not found from the sub', async () => {
    const wrongRefreshToken = createRefreshToken(192392131231231, 'foodeviceid');
    const { statusCode } = await getRequest(`${DELEGATE_URL}?refresh_token=${wrongRefreshToken}`);

    assert.equal(statusCode, 403);
  });

  it('should fail when no sub is found in the refresh token', async () => {
    const wrongRefreshToken = createRefreshToken(null, 'foodeviceid');
    const { statusCode } = await getRequest(`${DELEGATE_URL}?refresh_token=${wrongRefreshToken}`);

    assert.equal(statusCode, 403);
  });
});
