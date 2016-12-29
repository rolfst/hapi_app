/* global assert */
import blueprints from '../../../shared/test-utils/blueprints';
import { postRequest } from '../../../shared/test-utils/request';
import * as testHelper from '../../../shared/test-utils/helpers';


describe('Authenticate', () => {
  const url = '/v2/authenticate';
  const adminCredentials = blueprints.users.admin;
  const employeeCredentials = blueprints.users.employee;
  const networklessUserCredentials = blueprints.users.networkless;

  before(async () => {
    await testHelper.createUserForNewNetwork(adminCredentials, {});
    await testHelper.createUserForNewNetworkWithIntegration(
      { ...employeeCredentials, externalId: '8023' },
      {
        externalId: '8023',
      },
      {
        integrationName: 'PMT',
        token: '379ce9b4176cb89354c1f74b3a2c1c7a',
      });
  });

  after(async () => {
    // const allUsers = await testHelper.findAllUsers();
    // const allIntegrations = await testHelper.findAllIntegrations();
    // await testHelper.deleteUser(allUsers);
    // return testHelper.deleteIntegration(allIntegrations);
    return testHelper.cleanAll();
  });

  it('should check for required input fields', async () => {
    const response1 = postRequest(url, { foo: 'bar' });
    const response2 = postRequest(url, { username: 'bar' });
    const response3 = postRequest(url, { password: 'bar' });

    const responses = await Promise.all([response1, response2, response3]);

    assert.equal(responses[0].statusCode, 422);
    assert.equal(responses[1].statusCode, 422);
    assert.equal(responses[2].statusCode, 422);
  });

  it('should have the authenticated integrations in the access token', async () => {
    const expectedIntegrations = [{
      name: 'PMT',
      token: '379ce9b4176cb89354c1f74b3a2c1c7a',
      externalId: '8023',
    }];
    const decodedToken = await testHelper.getLoginToken(employeeCredentials);

    assert.deepEqual(decodedToken.integrations, expectedIntegrations);
  });

  it('should login with correct credentials', async () => {
    const { username, password } = employeeCredentials;
    const { result } = await postRequest(url, { username, password });
    const loginToken = result.data;

    assert.isDefined(loginToken.access_token);
    assert.isDefined(loginToken.refresh_token);
    assert.isDefined(loginToken.last_login);
  });

  it('should fail when password is not correct', async () => {
    const { username } = employeeCredentials;
    const { statusCode } = await postRequest(url, { username, password: 'wrongpassword' });

    assert.equal(statusCode, 403);
  });

  it('should fail when username is not correct', async () => {
    const { password } = employeeCredentials;
    const { statusCode } = await postRequest(url, { username: 'blabla@gmail.com', password });

    assert.equal(statusCode, 403);
  });

  it('should fail when user does not belong to a network', async () => {
    const { username, password } = networklessUserCredentials;
    const { statusCode } = await postRequest(url, { username, password });

    assert.equal(statusCode, 403);
  });
});
