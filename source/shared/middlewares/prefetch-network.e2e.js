import { Server } from 'hapi';
import { assert } from 'chai';
import jwtStrategy from './authenticator-strategy';
import { getRequest } from '../test-utils/request';
import preFetchNetwork from '../middlewares/prefetch-network';

let server;

describe('Plugin: Network', () => {
  beforeEach(() => {
    server = new Server();
    server.connection({ port: 2000 });
    server.auth.scheme('jwt', jwtStrategy);
    server.auth.strategy('jwt', 'jwt');

    server.route({
      method: 'GET',
      path: '/v2/networks/{networkId}',
      handler: (req, reply) => reply(req.pre.network),
      config: {
        auth: 'jwt',
        pre: [{ method: preFetchNetwork, assign: 'network' }],
      },
    });
  });

  afterEach(() => server.stop());

  it('should add network to request', async () => {
    const networkId = global.networks.pmt.id;
    const res = await getRequest(`/v2/networks/${networkId}`, server);

    assert.equal(res.result.id, networkId);
    assert.equal(res.statusCode, 200);
  });

  it('should respond with 404 when network is not found', async () => {
    const endpoint = '/v2/networks/1823918319813';
    const res = await getRequest(endpoint, server, global.tokens.employee);

    assert.equal(res.statusCode, 404);
  });

  it('should fail when user does not belong to the network', async () => {
    const endpoint = `/v2/networks/${global.networks.pmt.id}`;
    const res = await getRequest(endpoint, server, global.tokens.employee);

    assert.equal(res.statusCode, 403);
  });
});
