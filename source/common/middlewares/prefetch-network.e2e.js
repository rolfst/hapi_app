import { Server } from 'hapi';
import { assert } from 'chai';
import jwtStrategy from 'common/middlewares/authenticator-strategy';
import { getRequest } from 'common/test-utils/request';
import { createUser } from 'common/repositories/user';
import { createNetwork } from 'common/repositories/network';
import preFetchNetwork from 'common/middlewares/prefetch-network';
import generateNetworkName from 'common/test-utils/create-network-name';

describe('Plugin: Network', () => {
  let server;
  let network;
  let user;

  before(async () => {
    const userData = { username: 'john@flex-appeal.nl', firstName: 'John', lastName: 'Doe', password: 'hodor' };
    const createdUser = await createUser(userData);
    const createdNetwork = await createNetwork(createdUser.id, generateNetworkName());
    network = createdNetwork;
    user = createdUser;
  });

  beforeEach(() => {
    server = new Server();
    server.connection({ port: 2000 });
    server.auth.scheme('jwt', jwtStrategy);
    server.auth.strategy('jwt', 'jwt');
  });

  afterEach(() => server.stop());
  after(() => Promise.all([user.destroy(), network.destroy()]));

  it('should add network to request', async () => {
    const networkId = global.networks.flexAppeal.id;

    server.route({
      method: 'GET',
      path: '/v2/networks/{networkId}',
      handler: (req, reply) => reply(req.pre.network),
      config: {
        auth: 'jwt',
        pre: [{ method: preFetchNetwork, assign: 'network' }],
      },
    });

    const res = await getRequest(`/v2/networks/${networkId}`, server);

    assert.equal(res.result.id, networkId);
    assert.equal(res.statusCode, 200);
  });

  it('should fail when user does not belong to the network', async () => {
    server.route({
      method: 'GET',
      path: '/v2/networks/{networkId}',
      handler: (req, reply) => reply(req.pre.network),
      config: {
        pre: [{ method: preFetchNetwork, assign: 'network' }],
      },
    });

    const res = await getRequest(`/v2/networks/${network.id}`, server);

    assert.equal(res.statusCode, 403);
  });
});
