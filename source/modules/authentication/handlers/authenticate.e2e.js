import { assert } from 'chai';
import blueprints from 'common/test-utils/blueprints';
import NotInAnyNetwork from 'common/errors/not-in-any-network';
import WrongCredentials from 'common/errors/wrong-credentials';
import { postRequest } from 'common/test-utils/request';

const url = '/v2/authenticate';
const adminCredentials = blueprints.users.admin;
const employeeCredentials = blueprints.users.employee;
const networklessUserCredentials = blueprints.users.networkless;
const loginRequest = (username, password) => {
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

  it('should login with correct credentials', async () => {
    const { result } = await loginRequest(adminCredentials.username, adminCredentials.password);
    const { data } = result;

    assert.property(data, 'access_token');
    assert.property(data, 'refresh_token');
    assert.equal(data.user.username, adminCredentials.username);
  });

  it('should fail when credentials are not correct', async () => {
    const { result, statusCode } = await loginRequest(
      employeeCredentials.username,
      'wrongpassword'
    );

    assert.equal(result.error.title, WrongCredentials.type);
    assert.equal(statusCode, 403);
  });

  it('should fail when user does not belong to a network', async () => {
    const { result, statusCode } = await loginRequest(
      networklessUserCredentials.username,
      networklessUserCredentials.password
    );

    assert.equal(result.error.title, NotInAnyNetwork.type);
    assert.equal(statusCode, 403);
  });
});
