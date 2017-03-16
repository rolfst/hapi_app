/* global assert */
const blueprints = require('../../../shared/test-utils/blueprints');
const { postRequest } = require('../../../shared/test-utils/request');
const testHelper = require('../../../shared/test-utils/helpers');


describe('Authenticate', () => {
  const url = '/v2/authenticate';
  const adminCredentials = blueprints.users.admin;
  const employeeCredentials = blueprints.users.employee;
  const networklessUserCredentials = blueprints.users.networkless;

  before(async () => {
    const admin = await testHelper.createUser(adminCredentials);
    const employee = await testHelper.createUser(employeeCredentials);
    const { network } = await testHelper.createNetworkWithIntegration({
      userId: admin.id,
      userExternalId: '8023',
      externalId: '8023',
      name: 'pmt',
      integrationName: 'PMT',
      integrationToken: '379ce9b4176cb89354c1f74b3a2c1c7a',
      userToken: 'token',
    });

    return testHelper.addUserToNetwork({
      userId: employee.id,
      networkId: network.id });
  });

  after(() => testHelper.cleanAll());

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
