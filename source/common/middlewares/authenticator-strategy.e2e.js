import { Server } from 'hapi';
import { assert } from 'chai';
import jwtStrategy from 'common/middlewares/authenticator-strategy';
import { getRequest } from 'common/test-utils/request';
import preFetchNetwork from 'common/middlewares/prefetch-network';

const expiredToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0eXBlIjoiYWNjZXNzX3Rva2VuIiwiZXhwIjoxNDcwMzA4OTY0LCJpc3MiOiJodHRwczpcL1wvYXBpLmZsZXgtYXBwZWFsLm5sIiwiaWF0IjoxNDcwMzA1MzY0LCJzdWIiOjY0LCJkZXZpY2UiOiI2NUJGQjcwRTc3Rjg0OEVFQUQ3MzBFQ0U2RDkyRkY2NyIsImp0aSI6MzMxODg4N30.MdrwMF1VrSAhmwg0oKbQ0Tl6_Nu1WKVxrm1uMGsvR9E'; // eslint-disable-line
let server;

describe('Plugin: authenticator', () => {
  beforeEach(() => {
    server = new Server();
    server.connection({ port: 2000 });
    server.auth.scheme('jwt', jwtStrategy);
    server.auth.strategy('jwt', 'jwt');
  });

  afterEach(() => server.stop());

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

    const res = await getRequest('/v2/test', server, 'invalid_token');

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

    const res = await getRequest('/v2/test', server, expiredToken);

    assert.equal(res.statusCode, 401);
  });

  it('should succeed when the token is valid', async () => {
    const { flexAppeal } = global.networks;
    const { employee } = global.tokens;

    server.route({
      method: 'GET',
      path: '/v2/networks/{networkId}/test',
      handler: (req, reply) => reply('ok'),
      config: {
        auth: 'jwt',
        pre: [{ method: preFetchNetwork, assign: 'network' }],
      },
    });

    const res = await getRequest(`/v2/networks/${flexAppeal.id}/test`, server, employee);

    assert.equal(res.result, 'ok');
    assert.equal(res.statusCode, 200);
  });
});
