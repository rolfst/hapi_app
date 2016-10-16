import { assert } from 'chai';
import blueprints from '../../../shared/test-utils/blueprints';
import { postRequest } from '../../../shared/test-utils/request';
import tokenUtil from '../../../shared/utils/token';

const url = '/v2/authenticate';
const adminCredentials = blueprints.users.admin;
const employeeCredentials = blueprints.users.employee;
const networklessUserCredentials = blueprints.users.networkless;
const loginRequest = ({ username, password }) => {
  return postRequest(url, { username, password });
};

describe('Authenticate', () => {
  it('should check for required input fields', () => {
    const response1 = postRequest(url, { foo: 'bar' });
    const response2 = postRequest(url, { username: 'bar' });
    const response3 = postRequest(url, { password: 'bar' });

    return Promise.all([response1, response2, response3])
      .then(responses => {
        assert.equal(responses[0].statusCode, 422);
        assert.equal(responses[1].statusCode, 422);
        assert.equal(responses[2].statusCode, 422);
      });
  });

  it('should have the authenticated integrations in the access token', async () => {
    const { username, password } = adminCredentials;
    const { result } = await loginRequest({ username, password });
    const decodedToken = tokenUtil.decode(result.data.access_token);

    const expectedIntegrations = [{
      name: 'PMT',
      token: '379ce9b4176cb89354c1f74b3a2c1c7a',
      externalId: '8023',
    }];

    assert.deepEqual(decodedToken.integrations, expectedIntegrations);
  });

  it('should login with correct credentials', async () => {
    const { username, password } = employeeCredentials;
    const { result } = await loginRequest({ username, password });
    const { data } = result;

    assert.isDefined(data.access_token);
    assert.isDefined(data.refresh_token);
    assert.isDefined(data.last_login);
  });

  it('should fail when password is not correct', async () => {
    const { username } = employeeCredentials;
    const { statusCode } = await loginRequest({ username, password: 'wrongpassword' });

    assert.equal(statusCode, 403);
  });

  it('should fail when username is not correct', async () => {
    const { password } = employeeCredentials;
    const { statusCode } = await loginRequest({ username: 'blabla@gmail.com', password });

    assert.equal(statusCode, 403);
  });

  it('should fail when user does not belong to a network', async () => {
    const { username, password } = networklessUserCredentials;
    const { statusCode } = await loginRequest({ username, password });

    assert.equal(statusCode, 403);
  });
});
