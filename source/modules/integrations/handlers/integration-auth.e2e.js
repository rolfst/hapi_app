import sinon from 'sinon';
import { assert } from 'chai';
import nock from 'nock';
import createError from 'shared/utils/create-error';
import * as networkUtil from 'shared/utils/network';
import tokenUtil from 'shared/utils/token';
import * as createAdapter from 'shared/utils/create-adapter';
import { postRequest } from 'shared/test-utils/request';
import { createIntegrationNetwork } from 'shared/repositories/network';
import { findUserById } from 'shared/repositories/user';
import { createIntegration } from 'shared/repositories/integration';
import blueprints from 'shared/test-utils/blueprints';

describe('Integration auth', () => {
  let integration;
  let network;
  let hookStub;

  const authResult = {
    name: 'NEW_INTEGRATION',
    token: 'auth_token',
    externalId: 1,
  };

  const employeeCredentials = blueprints.users.employee;

  before(async () => {
    const fakeAdapter = {
      authenticate: () => Promise.resolve(authResult),
    };

    hookStub = sinon.stub(fakeAdapter, 'authenticate').returns(Promise.resolve(authResult));

    sinon.stub(createAdapter, 'default').returns(fakeAdapter);

    integration = await createIntegration({
      name: 'NEW_INTEGRATION',
      token: 'integrationtoken',
    });

    network = await createIntegrationNetwork({
      userId: global.users.admin.id,
      externalId: 'api.coolintegration.nl',
      name: 'Network with integration',
      integrationName: 'NEW_INTEGRATION',
    });

    await global.networks.pmt.addUser(global.users.employee);
    await network.addUser(global.users.employee);
  });

  after(async () => {
    await global.networks.pmt.removeUser(global.users.employee);
    await integration.destroy();
    await network.destroy();
  });

  it('hook should be called with the credentials', async () => {
    const endpoint = `/v2/networks/${network.id}/integration_auth`;
    const { statusCode } = await postRequest(endpoint, {
      username: employeeCredentials.username,
      password: employeeCredentials.password,
    }, global.server, global.tokens.employee);

    assert.equal(statusCode, 200);
    assert.isTrue(hookStub.calledWithMatch(
      { username: employeeCredentials.username, password: employeeCredentials.password }));
  });

  it('should return new access token', async () => {
    const endpoint = `/v2/networks/${network.id}/integration_auth`;
    const { result: { data } } = await postRequest(endpoint, {
      username: employeeCredentials.username,
      password: employeeCredentials.password,
    }, global.server, global.tokens.employee);

    const decodedToken = tokenUtil.decode(data.access_token);

    assert.deepEqual(decodedToken.integrations, [authResult]);
    assert.equal(decodedToken.sub, global.users.employee.id);
  });

  it('should add integration token for user in network', async () => {
    const endpoint = `/v2/networks/${network.id}/integration_auth`;
    await postRequest(endpoint, {
      username: 'foo',
      password: 'baz',
    }, global.server, global.tokens.employee);

    const user = await findUserById(global.users.employee.id);
    const { NetworkUser } = networkUtil.select(user.Networks, network.id);

    assert.equal(NetworkUser.userToken, 'auth_token');
    assert.equal(NetworkUser.externalId, 1);
  });

  it('should return 403 error when someone is already authenticated with the same account', async () => { // eslint-disable-line max-len
    createAdapter.default.restore();
    // Mock the same request being made in the setup for the admin to force the same externalId
    nock(global.networks.pmt.externalId)
      .post('/login')
      .reply(200, { logged_in_user_token: '379ce9b4176cb89354c1f74b3a2c1c7a', user_id: 8023 });

    const endpoint = `/v2/networks/${global.networks.pmt.id}/integration_auth`;
    const { statusCode } = await postRequest(endpoint, {
      username: 'foo',
      password: 'wrong_pass',
    }, global.server, global.tokens.employee);

    assert.equal(statusCode, 403);
  });

  it('should return 401 error when user could not authenticate with integration', async () => {
    const fakeAdapter = {
      authenticate: () => Promise.reject(createError('401')),
    };

    sinon.stub(createAdapter, 'default').returns(fakeAdapter);

    const endpoint = `/v2/networks/${network.id}/integration_auth`;
    const { statusCode } = await postRequest(endpoint, {
      username: 'foo',
      password: 'wrong_pass',
    }, global.server, global.tokens.employee);

    assert.equal(statusCode, 401);
  });
});