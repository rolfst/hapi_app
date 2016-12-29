import { assert } from 'chai';
import blueprints from '../../../shared/test-utils/blueprints';
import { postRequest } from '../../../shared/test-utils/request';

const url = '/v2/authenticate';
const employeeCredentials = blueprints.users.employee;
const networklessUserCredentials = blueprints.users.networkless;
const loginRequest = ({ username, password }) => {
  return postRequest(url, { username, password });
};

describe('Authenticate', () => {
  it('should check for required input fields', async () => {
    const response1 = postRequest(url, { foo: 'bar' });
    const response2 = postRequest(url, { username: 'bar' });
    const response3 = postRequest(url, { password: 'bar' });

    const responses = await Promise.all([response1, response2, response3]);

    assert.equal(responses[0].statusCode, 422);
    assert.equal(responses[1].statusCode, 422);
    assert.equal(responses[2].statusCode, 422);
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
