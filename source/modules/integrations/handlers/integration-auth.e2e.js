const sinon = require('sinon');
const { assert } = require('chai');
const nock = require('nock');
const { postRequest } = require('../../../shared/test-utils/request');
const adapterUtil = require('../../../shared/utils/create-adapter');
const testHelper = require('../../../shared/test-utils/helpers');
const blueprints = require('../../../shared/test-utils/blueprints');
const createError = require('../../../shared/utils/create-error');
const tokenUtil = require('../../../shared/utils/token');
const userRepo = require('../../core/repositories/user');

describe.only('Integration auth', () => {
  let sandbox;
  let employee;
  let pmtNetwork;
  let flexappealNetwork;
  let hookStub;

  const authResult = {
    name: 'NEW_INTEGRATION',
    token: 'auth_token',
    externalId: 1,
  };

  const employeeCredentials = blueprints.users.employee;

  before(async () => {
    sandbox = sinon.sandbox.create();
    const [admin, user] = await Promise.all([
      testHelper.createUser({ password: 'foo' }),
      testHelper.createUser({ password: 'bar' }),
    ]);
    employee = user;

    flexappealNetwork = await testHelper.createNetwork({ userId: admin.id, name: 'flexAppeal' });
    const { network } = await testHelper.createNetworkWithIntegration(
      { userId: admin.id,
        name: 'flexAppeal',
        externalId: 'api.coolintegration.nl',
        integrationName: 'NEW_INTEGRATION',
        integrationToken: 'integrationtoken',
      });
    pmtNetwork = network;

    const fakeAdapter = {
      authenticate: () => Promise.resolve(authResult),
    };
    hookStub = sandbox.stub(fakeAdapter, 'authenticate').returns(Promise.resolve(authResult));
    sandbox.stub(adapterUtil, 'createAdapter').returns(Promise.resolve(fakeAdapter));

    return Promise.all([
      testHelper.addUserToNetwork({ userId: employee.id, networkId: pmtNetwork.id }),
      testHelper.addUserToNetwork({ userId: employee.id, networkId: flexappealNetwork.id }),
    ]);
  });

  after(async () => {
    sandbox.restore();
    return testHelper.cleanAll();
  });

  it('hook should be called with the credentials', async () => {
    const endpoint = `/v2/networks/${flexappealNetwork.id}/integration_auth`;
    const { statusCode } = await postRequest(endpoint, {
      username: employeeCredentials.username,
      password: employeeCredentials.password,
    }, employee.token);

    assert.equal(statusCode, 200);
    assert.isTrue(hookStub.calledWithMatch(
      { username: employeeCredentials.username, password: employeeCredentials.password }));
  });

  it('should return new access token', async () => {
    const endpoint = `/v2/networks/${flexappealNetwork.id}/integration_auth`;
    const { result: { data } } = await postRequest(endpoint, {
      username: employeeCredentials.username,
      password: employeeCredentials.password,
    }, employee.token);

    const decodedToken = tokenUtil.decode(data.access_token);

    assert.equal(decodedToken.sub, employee.id);
  });

  it('should add integration token for user in network', async () => {
    const endpoint = `/v2/networks/${pmtNetwork.id}/integration_auth`;
    await postRequest(endpoint, {
      username: 'foo',
      password: 'baz',
    }, employee.token);

    const metaData = await userRepo.findNetworkLink({
      userId: employee.id, networkId: pmtNetwork.id });

    assert.equal(metaData.userToken, 'auth_token');
  });

  it('should return 403 error when someone is already authenticated with the same account', async () => { // eslint-disable-line max-len
    adapterUtil.createAdapter.restore();
    // Mock the same request being made in the setup for the admin to force the same externalId
    nock(pmtNetwork.externalId)
      .post('/login')
      .reply(200, { logged_in_user_token: '379ce9b4176cb89354c1f74b3a2c1c7a', user_id: 8023 });

    const endpoint = `/v2/networks/${pmtNetwork.id}/integration_auth`;
    const { statusCode } = await postRequest(endpoint, {
      username: 'foo',
      password: 'wrong_pass',
    }, employee.token);

    assert.equal(statusCode, 403);
  });

  it('should return 401 error when user could not authenticate with integration', async () => {
    const fakeAdapter = {
      authenticate: () => Promise.reject(createError('401')),
    };

    sinon.stub(adapterUtil, 'createAdapter').returns(Promise.resolve(fakeAdapter));

    const endpoint = `/v2/networks/${flexappealNetwork.id}/integration_auth`;
    const { statusCode } = await postRequest(endpoint, {
      username: 'foo',
      password: 'wrong_pass',
    }, employee.token);

    adapterUtil.createAdapter.restore();

    assert.equal(statusCode, 401);
  });
});
