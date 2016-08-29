import sinon from 'sinon';
import { assert } from 'chai';
import selectNetwork from 'common/utils/select-network';
import tokenUtil from 'common/utils/token';
import * as createAdapter from 'common/utils/create-adapter';
import { postRequest } from 'common/test-utils/request';
import { createIntegrationNetwork } from 'common/repositories/network';
import { findUserById } from 'common/repositories/user';
import { createIntegration } from 'common/repositories/integration';

describe('Integration auth', () => {
  let integration;
  let network;
  const authResult = {
    name: 'NEW_INTEGRATION',
    token: 'auth_token',
    externalId: 1,
  };

  before(async () => {
    const fakeAdapter = {
      authenticate: () => Promise.resolve(authResult),
    };

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

    await network.addUser(global.users.employee);
  });

  after(async () => {
    createAdapter.default.restore();
    await integration.destroy();
    await network.destroy();
  });

  it('should return new access token', async () => {
    const endpoint = `/v2/networks/${network.id}/integration_auth`;
    const { result: { data } } = await postRequest(endpoint, {
      username: 'foo',
      password: 'baz',
    }, global.server, global.tokens.employee);

    const actual = tokenUtil.decode(data.access_token);

    assert.deepEqual(actual.integrations, [authResult]);
  });

  it('should add integration token for user in network', async () => {
    const endpoint = `/v2/networks/${network.id}/integration_auth`;
    await postRequest(endpoint, {
      username: 'foo',
      password: 'baz',
    }, global.server, global.tokens.employee);

    const user = await findUserById(global.users.employee.id);
    const { NetworkUser } = selectNetwork(user.Networks, network.id);

    assert.equal(NetworkUser.userToken, 'auth_token');
  });

  it('should return 401 when user could not authenticate with integration', async () => {
    createAdapter.default.restore();
    const fakeAdapter = {
      authenticate: () => Promise.reject(new Error('Stubbed error')),
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
