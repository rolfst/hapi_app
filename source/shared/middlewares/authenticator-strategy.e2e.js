import { Server } from 'hapi';
import { assert } from 'chai';
import jwtStrategy from './authenticator-strategy';
import * as testHelper from '../test-utils/helpers';
import { getRequest } from '../test-utils/request';
import { createRoute } from '../utils/create-routes';
import preFetchNetwork from './prefetch-network';

const expiredToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0eXBlIjoiYWNjZXNzX3Rva2VuIiwiZXhwIjoxNDcwMzA4OTY0LCJpc3MiOiJodHRwczpcL1wvYXBpLmZsZXgtYXBwZWFsLm5sIiwiaWF0IjoxNDcwMzA1MzY0LCJzdWIiOjY0LCJkZXZpY2UiOiI2NUJGQjcwRTc3Rjg0OEVFQUQ3MzBFQ0U2RDkyRkY2NyIsImp0aSI6MzMxODg4N30.MdrwMF1VrSAhmwg0oKbQ0Tl6_Nu1WKVxrm1uMGsvR9E'; // eslint-disable-line

describe('Authenticator strategy', () => {
  let server;
  let employee;
  let flexAppeal;

  before(async () => {
    const [admin, user] = await Promise.all([
      testHelper.createUser({ password: 'foo' }),
      testHelper.createUser({ password: 'bar' }),
    ]);
    employee = user;

    flexAppeal = await testHelper.createNetwork({ name: 'flexappeal', userId: admin.id });

    return testHelper.addUserToNetwork({ userId: employee.id, networkId: flexAppeal.id });
  });

  after(() => testHelper.cleanAll());

  beforeEach(() => {
    server = new Server();
    server.connection({ port: 2000 });
    server.auth.scheme('jwt', jwtStrategy);
    server.auth.strategy('jwt', 'jwt');
  });

  afterEach(() => server.stop());

  it('should succeed when the token is valid', async () => {
    server.route({
      method: 'GET',
      path: '/v2/networks/{networkId}/test',
      handler: (req, reply) => reply('ok'),
      config: {
        auth: 'jwt',
        pre: [{ method: preFetchNetwork, assign: 'network' }],
      },
    });

    const res = await getRequest(`/v2/networks/${flexAppeal.id}/test`, employee.token, server);

    assert.equal(res.result, 'ok');
    assert.equal(res.statusCode, 200);
  });

  it('should fail when token is invalid', async () => {
    server.route({
      method: 'GET',
      path: '/v2/test',
      handler: (req, reply) => reply('ok'),
      config: {
        auth: 'jwt',
        pre: [{ method: preFetchNetwork, assign: 'network' }],
      },
    });

    const res = await getRequest('/v2/test', 'invalid_token', server);

    assert.equal(res.statusCode, 401);
  });

  it('should fail when token is expired', async () => {
    server.route({
      method: 'GET',
      path: '/v2/test',
      handler: (req, reply) => reply('ok'),
      config: {
        auth: 'jwt',
        pre: [{ method: preFetchNetwork, assign: 'network' }],
      },
    });

    const res = await getRequest('/v2/test', expiredToken, server);

    assert.equal(res.statusCode, 401);
  });

  it('should fail with 403 error when incoming request is from the chat module', async () => {
    const ENDPOINT = '/v1/chats/users/me/conversations';
    const route = createRoute({
      method: 'GET',
      url: ENDPOINT,
      handler: (req, reply) => reply('Foo'),
      prefetch: false,
    });

    server.route(route);
    const expiredTokenResponse = await getRequest(ENDPOINT, expiredToken, server);
    const wrongTokenResponse = await getRequest(ENDPOINT, 'invalid_token', server);

    assert.equal(expiredTokenResponse.statusCode, 403);
    assert.equal(wrongTokenResponse.statusCode, 403);
  });
});
